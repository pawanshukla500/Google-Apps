import { PoseDefinition, OutputQuality, StylePreset } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  'Minimal Catalog', 
  'High Fashion', 
  'Ethnic Wear', 
  'Casual Wear', 
  'Streetwear'
];

export const DEFAULT_POSES: PoseDefinition[] = [
  { id: 1, prompt: "Full body front view, standing natural, looking at camera, showcasing the complete outfit clearly." },
  { id: 2, prompt: "Side profile view, standing straight, highlighting the silhouette and fabric drape." },
  { id: 3, prompt: "Back view pose, looking over shoulder, showcasing back details of the garment." },
  { id: 4, prompt: "Sitting pose on a minimal stool or chair, relaxed but elegant posture." },
  { id: 5, prompt: "Close-up detail shot, focusing on fabric texture, prints, or specific design elements." },
];

export const DEFAULT_GLOBAL_PROMPT = "Tall scandinavian model, blonde hair, minimalist makeup, soft studio lighting.";

export const DEFAULT_QUALITY = OutputQuality.Q_2K;
export const DEFAULT_STYLE_PRESET: StylePreset = 'Minimal Catalog';