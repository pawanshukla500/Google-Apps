export enum OutputQuality {
  Q_2K = '2K',
  Q_4K = '4K'
}

export type StylePreset = 'Minimal Catalog' | 'High Fashion' | 'Ethnic Wear' | 'Casual Wear' | 'Streetwear';

export interface PoseDefinition {
  id: number;
  prompt: string;
}

export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface GeneratedImage {
  id: number;
  poseId: number;
  imageUrl: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  posePrompt: string;
  usage?: TokenUsage;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  type: 'front' | 'back';
}

export interface GlobalSettings {
  quality: OutputQuality;
  globalPrompt: string;
  stylePreset: StylePreset;
}

export interface AiStudioWindow {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}