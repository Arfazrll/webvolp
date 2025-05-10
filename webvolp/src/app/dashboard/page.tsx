'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiPhone, FiClock, FiInfo, FiPlus, FiVideo, FiCheck, FiX, FiAlertTriangle, FiMic, FiWifi } from 'react-icons/fi';
import { Navbar } from '../../components/ui/Navbar';
import { Footer } from '../../components/ui/Footer';
import { Button } from '../../components/ui/Button';
import { CallHistory } from '../../components/call/CallHistory';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCall } from '../../lib/hooks/useCall';
import { VideoChatGuide } from '../../components/call/VideoChatGuide';
import { VideoCallButton } from '../../components/call/VideoCallButton'; // Import komponen baru

export default function DashboardPage() {
  const { user } = useAuth();
  const { callHistory, toggleDialPad } = useCall();
  const [showVideoGuide, setShowVideoGuide] = useState(false);

  // Mengambil 5 panggilan terakhir untuk quick view
  const recentCalls = callHistory.slice(0, 5);

  // Ekstrak 4 digit terakhir nomor telepon untuk tampilan user
  const userDisplay = user?.phoneNumber 
    ? `User ${user.phoneNumber.slice(-4)}` 
    : 'User';

  const handleStartVideoCall = (phoneNumber: string) => {
    setShowVideoGuide(false);
    
    // Panggilan ke nomor akan dilakukan oleh komponen VideoCallButton
    // Tidak perlu kode tambahan di sini
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Selamat datang, {userDisplay}
            </h1>
            <p className="text-secondary-600">
              Kelola panggilan VoIP Anda dengan mudah
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/call" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiPhone className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Panggilan</h2>
                <p className="text-secondary-600 text-sm">
                  Mulai panggilan suara atau video baru
                </p>
              </div>
            </Link>
            
            <Link href="/history" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiClock className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Riwayat</h2>
                <p className="text-secondary-600 text-sm">
                  Lihat semua riwayat panggilan Anda
                </p>
              </div>
            </Link>
            
            <Link href="/about" className="block">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiInfo className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-medium mb-2">Tentang</h2>
                <p className="text-secondary-600 text-sm">
                  Informasi tentang VoIP App
                </p>
              </div>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Panggilan Terbaru</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm flex items-center"
                  onClick={() => setShowVideoGuide(true)}
                >
                  <FiVideo className="mr-2" /> Cek Kesiapan Video Call
                </Button>
                <Link href="/history">
                  <Button variant="outline" size="sm" className="text-sm">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </div>
            
            <CallHistory calls={recentCalls} />
            
            {recentCalls.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="text-secondary-500 mb-4">Belum ada riwayat panggilan</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/call">
                    <Button 
                      variant="default" 
                      className="inline-flex items-center"
                      onClick={() => toggleDialPad()}
                    >
                      <FiPlus className="mr-2" />
                      Buat Panggilan Baru
                    </Button>
                  </Link>
                  
                  {/* Tambahkan tombol Video Call */}
                  <VideoCallButton variant="outline" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Dialog Panduan Video Call */}
      {showVideoGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <VideoChatGuide 
            onClose={() => setShowVideoGuide(false)}
            onStartVideoCall={handleStartVideoCall}
          />
        </div>
      )}
    </div>
  );
}