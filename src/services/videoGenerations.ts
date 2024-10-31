import { supabase } from './supabase';
import { Contact } from '../types';
import { heygenApi } from './heygen';

interface VideoGeneration {
  id: string;
  projectId: string;
  contactId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class VideoGenerationService {
  async generateVideo(
    projectId: string,
    script: string,
    contact: Contact
  ): Promise<VideoGeneration> {
    try {
      // First create the video in HeyGen
      const heygenVideo = await heygenApi.createVideoInProject(
        projectId,
        script,
        contact
      );

      // Then create a record in our database
      const { data, error } = await supabase
        .from('video_generations')
        .insert({
          project_id: projectId,
          contact_id: contact.id,
          status: 'pending',
          heygen_video_id: heygenVideo.id,
          metadata: {
            contact: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              company: contact.company
            },
            script
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to save video generation record');
      }

      return {
        id: data.id,
        projectId: data.project_id,
        contactId: data.contact_id,
        status: data.status,
        videoUrl: data.video_url,
        error: data.error,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw error instanceof Error ? error : new Error('Failed to generate video');
    }
  }

  async getVideoGenerations(projectId: string): Promise<VideoGeneration[]> {
    try {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(record => ({
        id: record.id,
        projectId: record.project_id,
        contactId: record.contact_id,
        status: record.status,
        videoUrl: record.video_url,
        error: record.error,
        metadata: record.metadata,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    } catch (error) {
      console.error('Error loading video generations:', error);
      throw error instanceof Error ? error : new Error('Failed to load video generations');
    }
  }

  async updateVideoStatus(id: string, updates: Partial<VideoGeneration>): Promise<VideoGeneration> {
    try {
      const { data, error } = await supabase
        .from('video_generations')
        .update({
          status: updates.status,
          video_url: updates.videoUrl,
          error: updates.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        projectId: data.project_id,
        contactId: data.contact_id,
        status: data.status,
        videoUrl: data.video_url,
        error: data.error,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating video status:', error);
      throw error instanceof Error ? error : new Error('Failed to update video status');
    }
  }
}

export const videoGenerationService = new VideoGenerationService();