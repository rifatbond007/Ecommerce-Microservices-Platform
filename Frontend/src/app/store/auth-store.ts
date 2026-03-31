import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, users } from '../lib/mock-data';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const token = `mock-token-${user.id}`;
          set({ user, token });
          return { success: true };
        }
        
        return { success: false, error: 'Invalid email or password' };
      },

      register: async (data) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const exists = users.find(u => u.email === data.email);
        if (exists) {
          return { success: false, error: 'Email already registered' };
        }
        
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        const token = `mock-token-${newUser.id}`;
        set({ user: newUser, token });
        return { success: true };
      },

      logout: () => {
        set({ user: null, token: null });
      },

      updateProfile: (data) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...data };
          set({ user: updatedUser });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
