'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/ui/Navbar';
import { Footer } from '../../components/ui/Footer';
import { CallHistory } from '../../components/call/CallHistory';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCall } from '../../lib/hooks/useCall';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';
import { CallType, CallDirection, CallResult } from '../types';

export default function HistoryPage() {
  useAuth();
  const { callHistory } = useCall();
  const [filter, setFilter] = useState<{
    type?: CallType;
    direction?: CallDirection;
    result?: CallResult;
  }>({});

  // Penerapan filter ke riwayat panggilan
  const filteredCalls = callHistory.filter(call => {
    if (filter.type && call.type !== filter.type) return false;
    if (filter.direction && call.direction !== filter.direction) return false;
    if (filter.result && call.result !== filter.result) return false;
    return true;
  });

  const resetFilter = () => {
    setFilter({});
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">Riwayat Panggilan</h1>
            <p className="text-secondary-600">
              Lacak semua aktivitas panggilan Anda termasuk durasi, jenis, dan status panggilan
            </p>
          </header>

          {/* Filter Controls */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-grow">
                <h3 className="text-sm font-medium flex items-center">
                  <FiFilter className="mr-2" /> Filter
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select 
                  className="px-3 py-2 bg-secondary-50 rounded-md text-sm border border-secondary-200"
                  value={filter.type || ''}
                  onChange={(e) => setFilter(prev => ({...prev, type: e.target.value ? e.target.value as CallType : undefined}))}
                >
                  <option value="">Semua Jenis</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
                
                <select 
                  className="px-3 py-2 bg-secondary-50 rounded-md text-sm border border-secondary-200"
                  value={filter.direction || ''}
                  onChange={(e) => setFilter(prev => ({...prev, direction: e.target.value ? e.target.value as CallDirection : undefined}))}
                >
                  <option value="">Semua Arah</option>
                  <option value="incoming">Masuk</option>
                  <option value="outgoing">Keluar</option>
                </select>
                
                <select 
                  className="px-3 py-2 bg-secondary-50 rounded-md text-sm border border-secondary-200"
                  value={filter.result || ''}
                  onChange={(e) => setFilter(prev => ({...prev, result: e.target.value ? e.target.value as CallResult : undefined}))}
                >
                  <option value="">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="missed">Tidak Terjawab</option>
                  <option value="rejected">Ditolak</option>
                </select>
                
                <button 
                  className="px-3 py-2 bg-secondary-100 rounded-md text-sm border border-secondary-200 flex items-center"
                  onClick={resetFilter}
                >
                  <FiRefreshCw className="mr-1" /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Call History List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-secondary-100">
              <h2 className="text-lg font-medium">
                {Object.keys(filter).length > 0 
                  ? `Panggilan Terfilter (${filteredCalls.length})` 
                  : `Semua Panggilan (${callHistory.length})`}
              </h2>
            </div>
            
            <div className="divide-y divide-secondary-100">
              {filteredCalls.length > 0 ? (
                <CallHistory calls={filteredCalls} detailed />
              ) : (
                <div className="py-8 text-center text-secondary-500">
                  <p>Tidak ada riwayat panggilan yang sesuai dengan filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}