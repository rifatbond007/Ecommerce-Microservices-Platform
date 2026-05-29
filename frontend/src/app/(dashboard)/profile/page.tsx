'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<{ success: boolean; data: Profile }>('/users/profiles'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => api.put('/users/profiles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const profile = data?.data;

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          {profile ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-blue-600 hover:underline"
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName ?? profile.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName ?? profile.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone ?? profile.phone ?? ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">First Name</p>
                      <p className="font-medium">{profile.firstName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Name</p>
                      <p className="font-medium">{profile.lastName}</p>
                    </div>
                  </div>
                  {profile.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No profile found</p>
              <button className="py-2 px-4 bg-blue-600 text-white rounded">
                Create Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}