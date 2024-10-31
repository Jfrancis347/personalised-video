import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AvatarRequestList } from './AvatarRequestList';
import { ProjectRequestList } from './ProjectRequestList';

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="avatars" className="space-y-6">
          <TabsList>
            <TabsTrigger value="avatars">Avatar Requests</TabsTrigger>
            <TabsTrigger value="projects">Project Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="avatars">
            <AvatarRequestList />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectRequestList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}