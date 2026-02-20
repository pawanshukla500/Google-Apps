import { GoogleGenAI, Type } from "@google/genai";
import { AiStudioWindow, OutputQuality, TokenUsage } from '../types';

declare const window: AiStudioWindow;

// Helper to ensure we have a fresh client with the latest key
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const openApiKeySelector = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio API key selector not available in this environment.");
  }
};

interface GenerateParams {
  frontImageBase64: string;
  backImageBase64?: string;
  globalPrompt: string;
  posePrompt: string;
  quality: OutputQuality;
}

interface GenerateResult {
  imageUrl: string;
  usage: TokenUsage;
}

// Approximate pricing for Pro models (per 1M tokens) - Estimates
const INPUT_COST_PER_1M = 3.50;
const OUTPUT_COST_PER_1M = 10.50;

const calculateCost = (input: number = 0, output: number = 0) => {
  return ((input * INPUT_COST_PER_1M) + (output * OUTPUT_COST_PER_1M)) / 1000000;
};

export const generateFashionImage = async (params: GenerateParams): Promise<GenerateResult> => {
  const ai = getAiClient();
  
  // Clean base64 strings (remove data URL prefix if present)
  const cleanFront = params.frontImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const cleanBack = params.backImageBase64?.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const parts: any[] = [
    {
      text: `You are a professional fashion photographer for Youthnic. 
      Generate a photorealistic fashion image based on the reference product image(s).
      
      GLOBAL STYLE: ${params.globalPrompt}
      POSE INSTRUCTION: ${params.posePrompt}
      
      CRITICAL RULES:
      - Use the attached image(s) as the absolute source of truth for the garment.
      - Maintain exact fabric texture, color, print, and design details.
      - If a back view is provided, use it to accurately render the back of the garment if the pose requires it.
      - Generate a high-end catalog quality image on a clean studio background.
      - Natural human anatomy, no distortions.
      `
    },
    {
      inlineData: {
        mimeType: 'image/png', // Assuming converted to png or jpeg
        data: cleanFront
      }
    }
  ];

  if (cleanBack) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: cleanBack
      }
    });
    parts.push({ text: "The second image is the back view reference." });
  }

  const model = 'gemini-3-pro-image-preview';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        imageConfig: {
          imageSize: params.quality, // '2K' or '4K' maps directly to allowed values
          aspectRatio: '3:4', // Standard fashion portrait ratio
        }
      }
    });

    // Check for errors or safety blocks
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Generation failed: No candidates returned. The content might have been blocked by safety filters.");
    }

    // Extract usage
    const usageMeta = response.usageMetadata;
    const promptTokens = usageMeta?.promptTokenCount || 0;
    const responseTokens = usageMeta?.candidatesTokenCount || 0;
    const totalTokens = usageMeta?.totalTokenCount || 0;
    const estimatedCost = calculateCost(promptTokens, responseTokens);

    // Extract image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
          usage: {
            promptTokens,
            responseTokens,
            totalTokens,
            estimatedCost
          }
        };
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    
    // User-friendly Error Mapping
    let userMessage = "An unexpected error occurred during generation.";
    const errString = error.toString().toLowerCase();

    if (errString.includes("403") || errString.includes("permission denied")) {
      userMessage = "Access Denied. Please ensure your API key is valid and billing is enabled in Google AI Studio.";
    } else if (errString.includes("429") || errString.includes("resource exhausted")) {
      userMessage = "Rate Limit Exceeded. You are generating too fast. Please wait a minute before retrying.";
    } else if (errString.includes("safety") || errString.includes("blocked")) {
      userMessage = "Safety Filter Triggered. The model blocked the generation. Try adjusting your prompt to be more neutral.";
    } else if (errString.includes("500") || errString.includes("internal")) {
      userMessage = "Google AI Service Error. There is a temporary issue with the AI service. Please try again later.";
    } else if (errString.includes("model not found")) {
      userMessage = "Model Not Found. The selected model might not be available for your key.";
    } else if (error.message) {
      userMessage = error.message;
    }

    throw new Error(userMessage);
  }
};

export const generatePoseIdeas = async (imageBase64: string): Promise<string[]> => {
  const ai = getAiClient();
  const cleanImage = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const prompt = `Analyze this fashion garment in the image. 
  Suggest 5 distinct, high-end professional catalog pose descriptions that would best showcase this specific item's features (e.g. flow, fit, texture).
  
  The 5 poses must strictly follow this order:
  1. Full Body Front View
  2. Side Profile View
  3. Back View
  4. Sitting/Lifestyle Pose
  5. Close-up Detail Shot

  Provide the output as a JSON array of 5 strings. Do not include markdown formatting or json code blocks, just the raw json string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanImage } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (text) {
      // Parse JSON
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        return parsed.slice(0, 5) as string[];
      }
    }
    throw new Error("Invalid response format from pose generator");
  } catch (e) {
    console.error("Pose generation failed", e);
    // Fallback to defaults if analysis fails
    return [
       "Full body front view, standing natural, looking at camera.",
       "Side profile view highlighting the silhouette.",
       "Back view pose looking over shoulder.",
       "Sitting pose on a minimal stool, elegant posture.",
       "Close-up detail shot focusing on fabric texture."
    ];
  }
};

interface EditParams {
  imageBase64: string;
  prompt: string;
}

// Edit functionality using Gemini 2.5 Flash Image as requested
export const editFashionImage = async (params: EditParams): Promise<string> => {
  const ai = getAiClient();
  const cleanImage = params.imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const textPart = {
    text: `Edit this fashion image according to the following instruction: "${params.prompt}". 
    Maintain the model's identity and the garment's core details unless asked to change them.
    Keep the output photorealistic.`
  };

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: cleanImage
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart]
      },
      config: {}
    });

     const candidates = response.candidates;
     if (candidates && candidates.length > 0) {
       for (const part of candidates[0].content.parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
         }
       }
     }
     throw new Error("No image returned from edit operation.");

  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    let userMessage = "Edit failed.";
    if (error.message.includes("429")) userMessage = "Rate limit exceeded.";
    if (error.message.includes("safety")) userMessage = "Safety block triggered.";
    throw new Error(userMessage);
  }
};
