import { supabase } from './supabase';
import { TemplateRequest } from '../types';

class TemplateRequestService {
  async createRequest(data: {
    userId: string;
    name: string;
    avatarId: string;
    script: string;
  }): Promise<TemplateRequest> {
    try {
      // First, verify the table exists
      const { error: tableCheckError } = await supabase
        .from('template_requests')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Table check error:', tableCheckError);
        throw new Error('Template requests table not available');
      }

      // Create the request
      const { data: record, error } = await supabase
        .from('template_requests')
        .insert([{
          user_id: data.userId,
          name: data.name,
          avatar_id: data.avatarId,
          script: data.script,
          status: 'pending'
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error('Failed to create template request');
      }

      if (!record) {
        throw new Error('No data returned from template request creation');
      }

      return {
        id: record.id,
        userId: record.user_id,
        name: record.name,
        avatarId: record.avatar_id,
        script: record.script,
        status: record.status,
        heygenTemplateId: record.heygen_template_id,
        error: record.error,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      };
    } catch (error) {
      console.error('Error creating template request:', error);
      throw error;
    }
  }

  async getUserRequests(userId: string): Promise<TemplateRequest[]> {
    try {
      const { data, error } = await supabase
        .from('template_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase select error:', error);
        throw new Error('Failed to fetch template requests');
      }

      return (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        name: record.name,
        avatarId: record.avatar_id,
        script: record.script,
        status: record.status,
        heygenTemplateId: record.heygen_template_id,
        error: record.error,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching user template requests:', error);
      throw error;
    }
  }
}

export const templateRequestService = new TemplateRequestService();