'use client';

import React from 'react';
import { Navbar } from '../../components/ui/Navbar';
import { Footer } from '../../components/ui/Footer';
import { FiPhone, FiVideo, FiList } from 'react-icons/fi';
import { useAuth } from '../../lib/hooks/useAuth';

export default function AboutPage() {
  useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">Tentang VoIP App</h1>
            <p className="text-secondary-600">
              Informasi lengkap tentang aplikasi VoIP berbasis web ini
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Selamat Datang di VoIP App</h2>
              <p className="text-secondary-700 mb-4">
                VoIP App adalah aplikasi berbasis web yang terhubung dengan server VoIP Kamailio 
                untuk melakukan panggilan suara dan video menggunakan protokol UDP.
              </p>
              <p className="text-secondary-700 mb-4">
                Aplikasi ini menawarkan solusi komunikasi modern dengan kualitas panggilan yang tinggi, 
                antarmuka yang ramah pengguna, dan fitur lengkap untuk pengelolaan panggilan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-medium mb-4">Fitur Utama</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <FiPhone className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-medium mb-2">Panggilan Suara</h4>
                <p className="text-sm text-secondary-600">
                  Kualitas panggilan suara yang jernih dengan protokol UDP
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <FiVideo className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-medium mb-2">Panggilan Video</h4>
                <p className="text-sm text-secondary-600">
                  Komunikasi tatap muka dengan video call berkualitas tinggi
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <FiList className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-medium mb-2">Riwayat Panggilan</h4>
                <p className="text-sm text-secondary-600">
                  Pelacakan lengkap semua aktivitas panggilan
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}