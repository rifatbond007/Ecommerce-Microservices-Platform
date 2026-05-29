import { useAuthStore } from '@/stores/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => fetchAPI<T>(endpoint, { method: 'DELETE' }),
};