import { Type } from "@google/genai";

const USE_NVIDIA_NIM = process.env.USE_NVIDIA_NIM === 'true';

export interface GenerateContentParams {
  model: string;
  contents: string | any[];
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  };
}

export async function generateContent(
  params: GenerateContentParams,
  overrideModel?: string
): Promise<{ text: string }> {
  const model = overrideModel || params.model;
  if (USE_NVIDIA_NIM) {
    return await callNvidiaNim({ ...params, model });
  } else {
    return await callGemini({ ...params, model });
  }
}

async function callGemini(params: GenerateContentParams): Promise<{ text: string }> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  return await ai.models.generateContent({
    model: params.model,
    contents: params.contents,
    config: params.config
  });
}

async function callNvidiaNim(params: GenerateContentParams): Promise<{ text: string }> {
  // NVIDIA NIM API calls
  const apiKey = process.env.NVIDIA_NIM_API_KEY || "";
  const nimEndpoint = process.env.NVIDIA_NIM_ENDPOINT || "http://localhost:8000/v1";
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };

  // Prepare messages for NVIDIA NIM (typically OpenAI-compatible format)
  let messages: any[] = [];
  
  if (params.config?.systemInstruction) {
    messages.push({
      role: "system",
      content: params.config.systemInstruction
    });
  }

  // Handle both string and array contents
  const userContent = typeof params.contents === 'string' 
    ? params.contents 
    : JSON.stringify(params.contents);

  messages.push({
    role: "user",
    content: userContent
  });

  try {
    const response = await fetch(`${nimEndpoint}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: params.model || "meta/llama-2-7b-chat",
        messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096,
        ...(params.config?.responseMimeType === "application/json" && {
          response_format: { type: "json_object" }
        })
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA NIM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    return { text };
  } catch (error: any) {
    console.error("NVIDIA NIM API error:", error);
    throw error;
  }
}
