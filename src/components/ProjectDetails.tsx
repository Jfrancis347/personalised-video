import React, { useState } from 'react';
import { VideoGenerationsList } from './VideoGenerationsList';
import { GenerateVideoForm } from './GenerateVideoForm';
import { Project } from '../types';
import { ArrowLeft, Play, Settings } from 'lucide-react';

interface Props {
  project: Project;
  onBack: () => void;
}

export function ProjectDetails({ project, onBack }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVideoGenerated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Play className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">
                  {project.isActive ? 'Active' : 'Inactive'}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Script</dt>
                <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                  {project.script}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mb-6">
          <GenerateVideoForm 
            project={project}
            onSuccess={handleVideoGenerated}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Videos</h3>
          <VideoGenerationsList 
            key={refreshKey}
            projectId={project.id} 
          />
        </div>
      </div>
    </div>
  );
}