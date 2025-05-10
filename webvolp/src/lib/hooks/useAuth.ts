import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../app/store/authStore';

export function useAuth(requireAuth: boolean = true) {
  const { isLoggedIn, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // TODO: Dalam implementasi sebenarnya, gunakan mekanisme otentikasi yang lebih aman seperti
    // JWT atau token otentikasi dari backend - jangan gunakan localStorage untuk menyimpan
    // informasi otentikasi yang sensitif
    
    // Pemeriksaan sesi ini harus diganti dengan validasi token yang tepat
    const storedUser = localStorage.getItem('user');
    
    if (storedUser && !isLoggedIn) {
      try {
        const parsedUser = JSON.parse(storedUser);
        useAuthStore.setState({ user: parsedUser, isLoggedIn: true });
      } catch {
        // Invalid stored user, clear it
        localStorage.removeItem('user');
      }
    }

    // Redirect logic
    const shouldRedirect = requireAuth ? !isLoggedIn : isLoggedIn;
    
    if (shouldRedirect) {
      const redirectPath = requireAuth ? '/login' : '/dashboard';
      router.push(redirectPath);
    }
  }, [isLoggedIn, requireAuth, router]);

  return { isLoggedIn, user };
}