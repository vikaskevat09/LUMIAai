
import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, AspectRatio } from "../types.ts";

export const generateAIImages = async (settings: GenerationSettings): Promise<string[]> => {
  // Always use process.env.API_KEY directly as per SDK requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct the final prompt with style and quality enhancements
  const qualitySuffix = "ultra-high definition, masterpiece, cinematic lighting, professional composition, sharp focus, 8k resolution, professionally rendered";
  const fullPrompt = settings.style !== 'None' 
    ? `${settings.prompt}. Style: ${settings.style}. ${qualitySuffix}`
    : `${settings.prompt}. ${qualitySuffix}`;

  // Validate aspect ratio against supported values for gemini-2.5-flash-image
  const supportedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const finalAspectRatio = supportedRatios.includes(settings.aspectRatio) 
    ? settings.aspectRatio 
    : '1:1';

  const generatedImages: string[] = [];

  // Generate each variant in the batch
  for (let i = 0; i < settings.batchCount; i++) {
    const parts: any[] = [];

    // Add reference images first if present (multimodal best practices for image-to-image)
    if (settings.referenceImages && settings.referenceImages.length > 0) {
      settings.referenceImages.forEach((base64) => {
        const splitBase64 = base64.split(',');
        if (splitBase64.length < 2) return;
        
        const mimeTypeMatch = base64.match(/data:([^;]+);base64/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
        const data = splitBase64[1];
        
        parts.push({
          inlineData: {
            data: data,
            mimeType: mimeType
          }
        });
      });
    }

    // Add text prompt part
    parts.push({ text: fullPrompt });

    try {
      // Use the gemini-2.5-flash-image model with the specified configuration
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
          imageConfig: {
            aspectRatio: finalAspectRatio as any,
          }
        },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          }
        }
      }
    } catch (error) {
      console.error("Batch generation error:", error);
      throw error;
    }
  }

  return generatedImages;
};
