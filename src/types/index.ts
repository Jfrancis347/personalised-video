export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  createdAt: string;
}

export interface ProjectRequest {
  id: string;
  userId: string;
  name: string;
  avatarId: string;
  script: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  heygenProjectId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  avatarId: string;
  script: string;
  isActive: boolean;
  heygenProjectId?: string;
  createdAt: string;
  updatedAt: string;
  emailsSent?: number;
  thumbnail?: string;
}

export interface VideoGeneration {
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

export interface ScriptVariable {
  name: string;
  description: string;
  example?: string;
}