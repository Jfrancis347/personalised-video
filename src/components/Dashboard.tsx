import React, { useState } from 'react';
import { Header } from './Header';
import { UserAvatarList } from './UserAvatarList';
import { ProjectRequestForm } from './ProjectRequestForm';
import { ProjectList } from './ProjectList';
import { AvatarCreation } from './AvatarCreation';
import { TodaysContacts } from './TodaysContacts';
import { FacebookAdsOverview } from './facebook/FacebookAdsOverview';
import { Plus, Video } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

export function Dashboard() {
  const [showProjectCreation, setShowProjectCreation] = useState(false);
  const [showAvatarCreation, setShowAvatarCreation] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos">Video Generation</TabsTrigger>
            <TabsTrigger value="ads">Facebook Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div className="mb-8 flex space-x-4">
              <button
                onClick={() => setShowAvatarCreation(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request New Avatar
              </button>
              <button
                onClick={() => setShowProjectCreation(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Video className="h-5 w-5 mr-2" />
                Create New Project
              </button>
            </div>

            <div className="space-y-8">
              <TodaysContacts />
              <UserAvatarList />
              <ProjectList />
            </div>
          </TabsContent>

          <TabsContent value="ads">
            <FacebookAdsOverview />
          </TabsContent>
        </Tabs>

        {showAvatarCreation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full">
              <AvatarCreation onClose={() => setShowAvatarCreation(false)} />
            </div>
          </div>
        )}

        {showProjectCreation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full">
              <ProjectRequestForm onClose={() => setShowProjectCreation(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}