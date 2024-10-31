import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Project } from '../types';
import { ProjectDetails } from './ProjectDetails';
import { Loader2, AlertCircle, Play, Calendar, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: approvedProjects, error: projectError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .not('heygen_project_id', 'is', null)
        .order('created_at', { ascending: false });

      if (projectError) throw projectError;

      const activeProjects = (approvedProjects || []).map(project => ({
        id: project.id,
        userId: project.user_id,
        name: project.name,
        avatarId: project.avatar_id,
        script: project.script,
        isActive: true,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        heygenProjectId: project.heygen_project_id,
        emailsSent: 0,
        thumbnail: `https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&w=400&q=80`
      }));

      setProjects(activeProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetails
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Active Projects</h2>
          <p className="text-gray-500">
            Create and get a project approved to start generating personalized videos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="aspect-video bg-gray-100 relative group">
                {project.thumbnail && (
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {project.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {project.emailsSent || 0} Sent
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}