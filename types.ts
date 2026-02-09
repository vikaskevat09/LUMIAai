
export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE_16_9 = '16:9',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_3_4 = '3:4'
}

export enum Quality {
  STANDARD = 'Standard',
  HD = 'HD',
  ULTRA_HD = 'Ultra HD',
  K8 = '8K'
}

export interface GenerationSettings {
  prompt: string;
  style: string;
  aspectRatio: AspectRatio;
  quality: Quality;
  batchCount: number;
  referenceImages: string[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
}
