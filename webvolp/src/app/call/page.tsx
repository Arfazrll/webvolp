'use client';

import React, { useState } from 'react';
import { FiPhone, FiUsers, FiClock } from 'react-icons/fi';
import { Navbar } from '../../components/ui/Navbar';
import { Footer } from '../../components/ui/Footer';
import { Button } from '../../components/ui/Button';
import { DialPad } from '../../components/call/DialPad';
import { CallScreen } from '../../components/call/CallScreen';
import { CallHistory } from '../../components/call/CallHistory';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCall } from '../../lib/hooks/useCall';

export default function CallPage() {
  // Menggunakan useAuth() tanpa destructuring untuk menghindari variabel yang tidak digunakan
  useAuth();
  const { currentCall, callHistory, isDialPadOpen, toggleDialPad } = useCall();
  const [activeTab, setActiveTab] = useState<'history' | 'contacts'>('history');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Panggilan
            </h1>
            <p className="text-secondary-600">
              Mulai panggilan atau lihat riwayat panggilan
            </p>
          </header>

          {/* Current Call Section */}
          {currentCall && (
            <div className="mb-8">
              <CallScreen />
            </div>
          )}

          {/* Dial Pad or History Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              {isDialPadOpen ? (
                <DialPad />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <Button
                    variant="default"
                    className="w-full mb-4"
                    onClick={() => toggleDialPad()}
                  >
                    <FiPhone className="mr-2" />
                    Buka Dial Pad
                  </Button>
                  
                  <p className="text-center text-secondary-500 text-sm">
                    Klik tombol di atas untuk membuka dial pad dan mulai panggilan baru
                  </p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex border-b border-secondary-200">
                  <button
                    className={`flex-1 py-3 text-center font-medium ${
                      activeTab === 'history'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-secondary-600 hover:text-secondary-800'
                    }`}
                    onClick={() => setActiveTab('history')}
                  >
                    <span className="inline-flex items-center">
                      <FiClock className="mr-2" />
                      Riwayat
                    </span>
                  </button>
                  
                  <button
                    className={`flex-1 py-3 text-center font-medium ${
                      activeTab === 'contacts'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-secondary-600 hover:text-secondary-800'
                    }`}
                    onClick={() => setActiveTab('contacts')}
                  >
                    <span className="inline-flex items-center">
                      <FiUsers className="mr-2" />
                      Kontak
                    </span>
                  </button>
                </div>
                
                <div className="p-4">
                  {activeTab === 'history' ? (
                    <CallHistory calls={callHistory} />
                  ) : (
                    <div className="text-center p-8 text-secondary-500">
                      <FiUsers className="mx-auto text-4xl mb-2 text-secondary-400" />
                      <p>Fitur kontak akan segera tersedia</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}