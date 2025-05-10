import { create } from 'zustand';
import { AuthState, User } from '../types';


const authenticateWithKamailio = async (phoneNumber: string): Promise<User> => {
  throw new Error('Fungsi belum diimplementasikan');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,

  login: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementasikan autentikasi sesungguhnya, termasuk hashng password jika diperlukan
      const user = await authenticateWithKamailio(phoneNumber);
      
      localStorage.setItem('auth_token', JSON.stringify({ token: 'PLACEHOLDER_TOKEN', phoneNumber }));
      
      set({ user, isLoggedIn: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat login', 
        isLoading: false 
      });
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isLoggedIn: false });
    
  },
}));