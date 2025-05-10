import React from 'react';
import Link from 'next/link';
import { FiPhone, FiVideo, FiClock } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-secondary-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="flex-shrink-0 flex items-center text-primary-600 font-bold text-lg">
                <FiPhone className="mr-2" />
                <span>VoIP App</span>
              </span>
            </div>
            
            <div className="flex items-center">
              <Link 
                href="/login" 
                className="ml-4 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:text-center mb-16">
            <h1 className="text-3xl font-extrabold tracking-tight text-secondary-900 sm:text-4xl">
              Aplikasi VoIP Berbasis Web
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-secondary-500 lg:mx-auto">
              Solusi komunikasi modern terintegrasi dengan server Kamailio untuk panggilan suara dan video berkualitas tinggi.
            </p>
            <div className="mt-8">
              <Link 
                href="/login" 
                className="px-6 py-3 rounded-md bg-primary-600 text-white text-base font-medium hover:bg-primary-700 inline-flex items-center"
              >
                <FiPhone className="mr-2" />
                Mulai Sekarang
              </Link>
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiPhone className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Panggilan Suara</h3>
                <p className="mt-2 text-secondary-600">
                  Nikmati panggilan suara berkualitas tinggi melalui jaringan VoIP dengan protokol UDP.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiVideo className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Panggilan Video</h3>
                <p className="mt-2 text-secondary-600">
                  Komunikasi lebih personal dengan panggilan video yang lancar dan jernih.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <FiClock className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Riwayat Panggilan</h3>
                <p className="mt-2 text-secondary-600">
                  Lacak semua aktivitas panggilan Anda termasuk durasi, jenis, dan status panggilan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-secondary-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center md:flex-row md:justify-between">
            <div className="flex items-center">
              <FiPhone className="mr-2 text-primary-600" />
              <span className="text-sm text-secondary-600">
                VoIP Kamailio Web App
              </span>
            </div>
            
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-secondary-500">
                &copy; {new Date().getFullYear()} VoIP App. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}