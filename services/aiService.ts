import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface AIResponse {
  options: string[];
  tags: string[];
}

export const generatePollOptions = async (topic: string): Promise<AIResponse> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini.");
    return { options: ["Manual Option 1", "Manual Option 2"], tags: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 witty, short, and distinct poll options for the topic: "${topic}". Also provide 3 short, one-word tags relevant to the topic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 4 poll options",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 3 relevant tags (e.g. 'Tech', 'Food')",
            },
          },
          required: ["options", "tags"],
        },
      },
    });

    const text = response.text;
    if (!text) return { options: [], tags: [] };
    
    const data = JSON.parse(text);
    return {
      options: data.options || [],
      tags: data.tags || []
    };
  } catch (error) {
    console.error("Error generating options:", error);
    return { options: ["Manual Option 1", "Manual Option 2"], tags: [] };
  }
};