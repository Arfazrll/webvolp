import { create } from 'zustand';
import { AuthState, User } from '../types';

// Mock authentication function (replace with actual Kamailio authentication)
const authenticateWithKamailio = async (phoneNumber: string): Promise<User> => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate successful login
      if (phoneNumber && phoneNumber.length >= 10) {
        resolve({
          phoneNumber,
          name: `User ${phoneNumber.slice(-4)}`,
          avatar: '/images/avatar.png',
        });
      } else {
        reject(new Error('Nomor telepon tidak valid'));
      }
    }, 1000);
  });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,

  login: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authenticateWithKamailio(phoneNumber);
      
      // Save user to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, isLoggedIn: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat login', 
        isLoading: false 
      });
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, isLoggedIn: false });
  },
}));