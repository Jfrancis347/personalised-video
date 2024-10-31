import { env } from '../config/env';

interface VideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
}

class HeyGenAPI {
  private baseUrl = 'https://api.heygen.com/v1';
  private headers: HeadersInit;
  private isDevelopment = import.meta.env.DEV;

  constructor() {
    const apiKey = env.VITE_HEYGEN_API_KEY.trim();
    this.headers = {
      'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (this.isDevelopment) {
      return this.mockResponse(endpoint, options);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP error! status: ${response.status}`
        }));
        throw new Error(JSON.stringify(errorData));
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private mockResponse(endpoint: string, options: RequestInit) {
    console.log('Development mode: Mocking API response for', endpoint);
    
    switch (endpoint) {
      case '/avatars':
        return Promise.resolve({ avatars: [] });
      
      case '/videos':
        if (options.method === 'POST') {
          return Promise.resolve({
            video_id: `dev_${Date.now()}`,
            status: 'pending',
            video_url: 'https://example.com/sample-video.mp4'
          });
        }
        break;

      default:
        if (endpoint.startsWith('/videos/')) {
          const videoId = endpoint.split('/')[2];
          const timestamp = parseInt(videoId.split('_')[1] || '0');
          const elapsedTime = Date.now() - timestamp;
          
          if (elapsedTime < 5000) {
            return Promise.resolve({ status: 'pending' });
          } else if (elapsedTime < 10000) {
            return Promise.resolve({ status: 'processing' });
          } else {
            return Promise.resolve({
              status: 'completed',
              video_url: 'https://example.com/sample-video.mp4'
            });
          }
        }
    }

    return Promise.resolve({});
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/avatars');
      return true;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }

  async createVideoInProject(
    avatarId: string,
    script: string,
    contact: any
  ): Promise<VideoResponse> {
    if (!avatarId || !script) {
      throw new Error('Avatar ID and script are required');
    }

    try {
      const payload = {
        avatar_id: avatarId,
        background: {
          type: "color",
          value: "#ffffff"
        },
        clips: [
          {
            avatar_id: avatarId,
            avatar_style: "normal",
            input_text: script,
            voice_id: "en-US-JennyNeural",
            voice_settings: {
              stability: 0.5,
              similarity: 0.75
            },
            background: {
              type: "color",
              value: "#ffffff"
            },
            video_settings: {
              ratio: "16:9",
              quality: "high"
            }
          }
        ],
        test: this.isDevelopment,
        enhance: true
      };

      const data = await this.makeRequest('/videos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        id: data.video_id || data.id,
        status: 'pending',
        video_url: data.video_url
      };
    } catch (error) {
      console.error('Error creating video:', error);
      throw error instanceof Error ? error : new Error('Failed to create video');
    }
  }

  async getVideoStatus(videoId: string): Promise<VideoResponse> {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    try {
      const data = await this.makeRequest(`/videos/${videoId}`);
      
      return {
        id: videoId,
        status: data.status,
        video_url: data.video_url,
        error: data.error
      };
    } catch (error) {
      console.error('Error getting video status:', error);
      throw error instanceof Error ? error : new Error('Failed to get video status');
    }
  }
}

export const heygenApi = new HeyGenAPI();