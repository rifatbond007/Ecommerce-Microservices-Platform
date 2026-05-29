'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<{ success: boolean; data: Address[] }>('/users/addresses'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/users/addresses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      setFormData({ label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'USA' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const addresses = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <select
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address Line 1</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-6 relative">
            {address.isDefault && (
              <span className="absolute top-4 right-4 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Default
              </span>
            )}
            <h3 className="font-semibold text-lg mb-2">{address.label}</h3>
            <p className="text-gray-600">{address.fullName}</p>
            <p className="text-gray-600">{address.phone}</p>
            <p className="text-gray-600 mt-2">
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
            </p>
            <p className="text-gray-600">
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p className="text-gray-600">{address.country}</p>
            <button
              onClick={() => deleteMutation.mutate(address.id)}
              className="mt-4 text-red-600 text-sm hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}