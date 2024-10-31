import { supabase } from './supabase';
import { VideoGeneration } from '../types';

interface VideoGenerationRecord extends VideoGeneration {
  videoId: string;
  createdAt: Date;
  updatedAt: Date;
}

class VideoStore {
  async createVideoGeneration(data: {
    contactId: string;
    templateId: string;
    videoId: string;
  }): Promise<VideoGenerationRecord> {
    try {
      const { data: record, error } = await supabase
        .from('video_generations')
        .insert({
          contact_id: data.contactId,
          template_id: data.templateId,
          video_id: data.videoId,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        contactId: record.contact_id,
        templateId: record.template_id,
        videoId: record.video_id,
        status: record.status,
        videoUrl: record.video_url,
        error: record.error,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      };
    } catch (error) {
      console.error('Error creating video generation record:', error);
      throw error;
    }
  }

  async updateVideoStatus(
    videoId: string,
    status: VideoGeneration['status'],
    updates: Partial<VideoGeneration> = {}
  ): Promise<VideoGenerationRecord | null> {
    try {
      const { data: record, error } = await supabase
        .from('video_generations')
        .update({
          status,
          video_url: updates.videoUrl,
          error: updates.error,
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', videoId)
        .select()
        .single();

      if (error) throw error;
      if (!record) return null;

      return {
        contactId: record.contact_id,
        templateId: record.template_id,
        videoId: record.video_id,
        status: record.status,
        videoUrl: record.video_url,
        error: record.error,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      };
    } catch (error) {
      console.error('Error updating video status:', error);
      throw error;
    }
  }

  async getRecentVideos(limit = 10): Promise<VideoGenerationRecord[]> {
    try {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(record => ({
        contactId: record.contact_id,
        templateId: record.template_id,
        videoId: record.video_id,
        status: record.status,
        videoUrl: record.video_url,
        error: record.error,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching recent videos:', error);
      throw error;
    }
  }
}

export const videoStore = new VideoStore();