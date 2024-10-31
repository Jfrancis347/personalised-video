import React from 'react';
import { Play, Info } from 'lucide-react';
import type { VideoTemplate } from '../types';

const templates: VideoTemplate[] = [
  {
    id: '1',
    name: 'Welcome Message',
    description: 'Personalized welcome video for new contacts',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&w=400',
  },
  {
    id: '2',
    name: 'Product Introduction',
    description: 'Showcase your product with personal touch',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400',
  },
];

export function VideoTemplateList() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="group relative">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    className="bg-white text-gray-900 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-100 transition-colors"
                    onClick={() => console.log(`Preview template: ${template.id}`)}
                  >
                    <Play className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => console.log(`Show info for template: ${template.id}`)}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}