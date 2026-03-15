import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { MetricsAggregator } from "./MetricsAggregator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // NLP Pre-parsing endpoint (Alternative to spaCy)
  app.post("/api/parse", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });
      
      // Dynamic import to avoid issues with CJS/ESM
      const nlp = (await import('compromise')).default;
      const doc = nlp(text);
      const sentences = doc.sentences().out('array');
      
      const segments = sentences.map((s: string, i: number) => ({
        id: `s${i + 1}`,
        text: s.trim()
      }));
      
      res.json({ segments });
    } catch (e) {
      console.error("Parsing error:", e);
      res.status(500).json({ error: "Failed to parse text" });
    }
  });

  // Quantitative Metrics Middleware Endpoint
  app.post("/api/metrics", (req, res) => {
    try {
      const { results, totalSegments } = req.body;
      if (!results || typeof totalSegments !== 'number') {
        return res.status(400).json({ error: "Invalid input" });
      }
      const metrics = MetricsAggregator.calculateMetrics({ results }, totalSegments);
      res.json(metrics);
    } catch (e) {
      console.error("Metrics error:", e);
      res.status(500).json({ error: "Failed to calculate metrics" });
    }
  });

  function get_active_dimensions() {
    const dir = path.join(process.cwd(), 'assets', 'dimensions');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  function resolve_agent_context(dimension_id: string, agent_role: string) {
    const dimDir = path.join(process.cwd(), 'assets', 'dimensions', dimension_id);
    if (fs.existsSync(dimDir)) {
      const files = fs.readdirSync(dimDir);
      // Case-insensitive match for agent_role (e.g., 'detector' or 'nuance')
      // Also handle prefixes like 'det' for detector
      const searchStr = agent_role.toLowerCase().substring(0, 3);
      const matchedFile = files.find(f => f.toLowerCase().startsWith(searchStr) && f.endsWith('.md'));
      if (matchedFile) {
        return fs.readFileSync(path.join(dimDir, matchedFile), 'utf-8');
      }
    }
    // Fallback
    const fallbackPath = path.join(process.cwd(), 'assets', 'dimensions', 'default_bias_definitions.md');
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath, 'utf-8');
    }
    return "";
  }

  function get_dimension_info(dimension_id: string) {
    const content = resolve_agent_context(dimension_id, 'detector');
    let description = "";
    if (content) {
      const lines = content.split(/\r?\n/);
      const startIndex = lines.findIndex(l => l.includes('## 1. Core Definition'));
      if (startIndex !== -1) {
        let descLines = [];
        for (let i = startIndex + 1; i < lines.length; i++) {
          if (lines[i].trim().startsWith('##')) break;
          if (lines[i].trim()) descLines.push(lines[i].trim());
        }
        description = descLines.join(' ');
      }
    }
    return { id: dimension_id, description };
  }

  // Dynamic Ingestion: List available dimensions by scanning the assets/dimensions folder
  app.get("/api/dimensions", (req, res) => {
    try {
      const dims = get_active_dimensions();
      const info = dims.map(get_dimension_info);
      res.json(info);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Fetch a specific agent's system prompt
  app.get("/api/agents/:agent/prompt", (req, res) => {
    try {
      const agent = req.params.agent;
      // Map 'orchestrator' to 'governance' for the filename as per spec
      const filename = agent === 'orchestrator' ? 'system_prompt_governance.txt' : `system_prompt_${agent}.txt`;
      const filePath = path.join(process.cwd(), 'agents', agent, filename);
      if (fs.existsSync(filePath)) {
        res.send(fs.readFileSync(filePath, 'utf-8'));
      } else {
        res.status(404).send("Prompt not found");
      }
    } catch (e) {
      res.status(500).send(String(e));
    }
  });

  // Fetch a specific dimension document for a specific agent
  app.get("/api/agents/:agent/dimensions/:dimension", (req, res) => {
    try {
      const { agent, dimension } = req.params;
      const content = resolve_agent_context(dimension, agent);
      if (content) {
        res.send(content);
      } else {
        res.status(404).send(""); // Return empty if dimension doesn't exist for this agent
      }
    } catch (e) {
      res.status(500).send(String(e));
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
