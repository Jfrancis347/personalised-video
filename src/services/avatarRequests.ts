import { supabase } from './supabase';

export interface AvatarRequest {
  id: string;
  userId: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl: string;
  heygenAvatarId?: string;
  createdAt: string;
  updatedAt: string;
}

class AvatarRequestService {
  async createRequest(userId: string, name: string, videoFile: File): Promise<AvatarRequest> {
    try {
      // 1. Upload video file to Supabase Storage
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatar-videos')
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded video
      const { data: { publicUrl } } = supabase.storage
        .from('avatar-videos')
        .getPublicUrl(filePath);

      // 3. Create avatar request record
      const { data, error } = await supabase
        .from('avatar_requests')
        .insert({
          user_id: userId,
          name: name,
          status: 'pending',
          video_url: publicUrl
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        status: data.status,
        videoUrl: data.video_url,
        heygenAvatarId: data.heygen_avatar_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating avatar request:', error);
      throw error;
    }
  }

  async getUserRequests(userId: string): Promise<AvatarRequest[]> {
    try {
      const { data, error } = await supabase
        .from('avatar_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        name: record.name,
        status: record.status,
        videoUrl: record.video_url,
        heygenAvatarId: record.heygen_avatar_id,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  }
}

export const avatarRequestService = new AvatarRequestService();