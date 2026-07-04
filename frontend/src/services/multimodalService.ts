/**
 * Multimodal Service
 *
 * TypeScript service for multimodal prediction API endpoints
 * Phase 6: Multimodal Prediction
 */

// Types
export interface HistoricalDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface MultimodalTrainRequest {
  model_id: string;
  numerical_data: HistoricalDataPoint[];
  text_data?: string[];
  image_paths?: string[];
  audio_paths?: string[];
  video_paths?: string[];
  target_col?: string;
  fusion_method?: 'attention' | 'concat' | 'weighted';
  text_encoder?: string;
  image_encoder?: string;
  audio_encoder?: string;
}

export interface MultimodalTrainResponse {
  success: boolean;
  model_id: string;
  training_result: {
    status: string;
    base_model: string;
    fusion_method: string;
    modality_contributions: Record<string, number>;
  };
  trained_at: string;
}

export interface MultimodalPredictRequest {
  model_id: string;
  numerical_data: HistoricalDataPoint[];
  horizon: number;
  text?: string;
  image?: string; // base64 encoded
  audio?: string;
  video?: string;
}

export interface MultimodalPredictResponse {
  success: boolean;
  model_id: string;
  forecast: number[];
  horizon: number;
  modality_contributions: Record<string, number>;
  generated_at: string;
}

export interface TextEncodingRequest {
  texts: string[];
  model_name?: string;
}

export interface TextEncodingResponse {
  success: boolean;
  model_name: string;
  embeddings: number[][];
  embedding_dim: number;
  num_texts: number;
}

export interface ImageEncodingResponse {
  success: boolean;
  model_name: string;
  embedding: number[];
  embedding_dim: number;
}

export interface AudioEncodingResponse {
  success: boolean;
  model_name: string;
  embedding: number[];
  embedding_dim: number;
}

export interface VideoEncodingResponse {
  success: boolean;
  embedding: number[];
  embedding_dim: number;
  num_frames: number;
}

export interface FusionRequest {
  features: {
    numerical?: number[][];
    text?: number[][];
    image?: number[][];
    audio?: number[][];
    video?: number[][];
  };
  method?: 'attention' | 'concat' | 'weighted';
  fusion_dim?: number;
}

export interface FusionResponse {
  success: boolean;
  fusion_method: string;
  fused_embedding: number[];
  fusion_dim: number;
  input_modalities: string[];
  attention_weights?: Record<string, number>;
}

export interface ModalityInfo {
  description: string;
  supported_formats: string[];
  encoders: string[];
  available: boolean;
}

export interface MultimodalInfoResponse {
  success: boolean;
  supported_modalities: {
    text: ModalityInfo;
    image: ModalityInfo;
    audio: ModalityInfo;
    video: ModalityInfo;
  };
  fusion_methods: {
    [key: string]: {
      description: string;
      best_for: string;
    };
  };
  available_libraries: {
    torch: boolean;
    transformers: boolean;
    timm: boolean;
  };
  timestamp: string;
}

// API Base URL
const API_BASE = '/api/ml-pipeline/multimodal';

/**
 * Multimodal Service Class
 */
class MultimodalService {
  /**
   * Check multimodal module health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE}/health/`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Train multimodal model
   */
  async train(request: MultimodalTrainRequest): Promise<MultimodalTrainResponse> {
    const response = await fetch(`${API_BASE}/train/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training failed');
    }

    return response.json();
  }

  /**
   * Generate multimodal forecast
   */
  async predict(request: MultimodalPredictRequest): Promise<MultimodalPredictResponse> {
    const response = await fetch(`${API_BASE}/predict/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Encode text to embedding
   */
  async encodeText(request: TextEncodingRequest): Promise<TextEncodingResponse> {
    const response = await fetch(`${API_BASE}/encode/text/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Text encoding failed');
    }

    return response.json();
  }

  /**
   * Encode image to embedding
   */
  async encodeImage(
    imageFile: File,
    modelName: string = 'resnet50'
  ): Promise<ImageEncodingResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('model_name', modelName);

    const response = await fetch(`${API_BASE}/encode/image/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Image encoding failed');
    }

    return response.json();
  }

  /**
   * Encode audio to embedding
   */
  async encodeAudio(
    audioFile: File,
    modelName: string = 'whisper-base'
  ): Promise<AudioEncodingResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('model_name', modelName);

    const response = await fetch(`${API_BASE}/encode/audio/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Audio encoding failed');
    }

    return response.json();
  }

  /**
   * Encode video to embedding
   */
  async encodeVideo(
    videoFile: File,
    numFrames: number = 8
  ): Promise<VideoEncodingResponse> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('num_frames', numFrames.toString());

    const response = await fetch(`${API_BASE}/encode/video/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Video encoding failed');
    }

    return response.json();
  }

  /**
   * Fuse multimodal features
   */
  async fuseFeatures(request: FusionRequest): Promise<FusionResponse> {
    const response = await fetch(`${API_BASE}/fusion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Feature fusion failed');
    }

    return response.json();
  }

  /**
   * Get multimodal information
   */
  async getInfo(): Promise<MultimodalInfoResponse> {
    const response = await fetch(`${API_BASE}/info/`);

    if (!response.ok) {
      throw new Error('Failed to get multimodal info');
    }

    return response.json();
  }

  /**
   * List all multimodal models
   */
  async listModels(): Promise<any> {
    const response = await fetch(`${API_BASE}/models/`);

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    return response.json();
  }

  /**
   * Helper method: Convert image file to base64
   */
  static async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper method: Prepare training request with defaults
   */
  static prepareTrainRequest(
    modelId: string,
    numericalData: HistoricalDataPoint[],
    options: Partial<MultimodalTrainRequest> = {}
  ): MultimodalTrainRequest {
    return {
      model_id: modelId,
      numerical_data: numericalData,
      text_data: options.text_data,
      image_paths: options.image_paths,
      audio_paths: options.audio_paths,
      video_paths: options.video_paths,
      target_col: options.target_col || 'value',
      fusion_method: options.fusion_method || 'attention',
      text_encoder: options.text_encoder || 'bert',
      image_encoder: options.image_encoder || 'resnet',
      audio_encoder: options.audio_encoder || 'whisper'
    };
  }

  /**
   * Helper method: Prepare prediction request with defaults
   */
  static preparePredictRequest(
    modelId: string,
    numericalData: HistoricalDataPoint[],
    horizon: number,
    text?: string,
    imageFile?: File,
    options: Partial<MultimodalPredictRequest> = {}
  ): Promise<MultimodalPredictRequest> {
    return new Promise(async (resolve) => {
      const request: MultimodalPredictRequest = {
        model_id: modelId,
        numerical_data: numericalData,
        horizon: horizon,
        text: text,
        image: undefined,
        audio: options.audio,
        video: options.video
      };

      if (imageFile) {
        request.image = await this.imageToBase64(imageFile);
      }

      resolve(request);
    });
  }
}

// Export singleton instance
export const multimodalService = new MultimodalService();
export default multimodalService;
