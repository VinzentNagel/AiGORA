import { GoogleGenAI, Type } from "@google/genai";

export interface RemediationResult {
  explanation: string;
  neutralized_text: string;
}

export async function remediateSegment(
  originalText: string,
  dimensionDoc: string,
  detectorLog: string,
  severityLevel: number
): Promise<RemediationResult> {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const systemInstruction = `You are a Pedagogical Rewriter. You receive a text segment that has been flagged for bias by an automated system.
Task 1 (Deep Explanation): In one clear paragraph, explain how the text violates the provided dimension criteria. Do not use academic jargon; write for a tired teacher.
Task 2 (Neutralization): Rewrite the original text to remove the bias.
Constraint A: You must preserve the core educational facts and reading level.
Constraint B: If the bias is purely linguistic (e.g., passive verbs), fix the grammar.
Constraint C: If the bias is historical erasure, add the missing context neutrally. Output strictly as JSON.`;

  const prompt = `
Segment to analyze: "${originalText}"
Dimension Criteria: 
${dimensionDoc}

Detector Log: ${detectorLog}
Severity Level: ${severityLevel}

Return a JSON object with:
{
  "explanation": "...",
  "neutralized_text": "..."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            neutralized_text: { type: Type.STRING }
          },
          required: ["explanation", "neutralized_text"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini API");

    const result = JSON.parse(text);
    return result as RemediationResult;
  } catch (error: any) {
    console.error("Client-side remediation error:", error);
    throw error;
  }
}
