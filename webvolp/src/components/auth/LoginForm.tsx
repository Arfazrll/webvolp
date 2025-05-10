import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPhone } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '../../app/store/authStore';

export function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!phoneNumber.trim()) {
      setError('Nomor telepon tidak boleh kosong');
      return;
    }
    
    // TODO: Dalam implementasi sebenarnya, validasi nomor telepon seharusnya
    // dilakukan oleh backend, bukan hardcoded di frontend
    
    try {
      await login(phoneNumber);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
          <FiPhone className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold">Login ke VoIP App</h1>
        <p className="text-secondary-600 mt-2">
          Masukkan nomor telepon Anda yang terdaftar di server VoIP Kamailio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="tel"
          label="Nomor Telepon"
          placeholder="Masukkan nomor telepon"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setError('');
          }}
          error={error}
          required
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-secondary-500">
        <p>
          Sistem ini terhubung dengan server VoIP Kamailio menggunakan protokol WebRTC.
        </p>
      </div>
    </div>
  );
}