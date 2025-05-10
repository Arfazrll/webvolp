import React from 'react';
import { 
  FiPhone, FiPhoneIncoming, FiPhoneOutgoing, FiPhoneMissed, 
  FiVideo, FiClock, FiInfo
} from 'react-icons/fi';
import { Call, CallType } from '../../app/types';
import { useCall } from '../../lib/hooks/useCall';
import { formatDate, formatDuration, formatPhoneNumber } from '../../lib/utils/formatters';

interface CallHistoryProps {
  calls: Call[];
  detailed?: boolean;
}

export function CallHistory({ calls, detailed = false }: CallHistoryProps) {
  const { makeCall } = useCall();

  const formatCallDate = (date?: Date) => {
    if (!date) return '';
    return formatDate(date);
  };

  const getCallIcon = (call: Call) => {
    // First determine call type (audio/video)
    const isVideo = call.type === 'video';
    
    // Then determine direction and result
    if (call.direction === 'incoming') {
      if (call.result === 'missed') {
        return <FiPhoneMissed className="text-red-500" />;
      } else if (isVideo) {
        return <FiVideo className="text-primary-500" />;
      } else {
        return <FiPhoneIncoming className="text-green-500" />;
      }
    } else {
      return isVideo ? 
        <FiVideo className="text-primary-500" /> : 
        <FiPhoneOutgoing className="text-primary-600" />;
    }
  };

  const getCallStatusText = (call: Call) => {
    if (call.result === 'missed') return 'Tidak Dijawab';
    if (call.result === 'rejected') return 'Ditolak';
    if (call.result === 'completed') return 'Selesai';
    
    return call.status === 'active' ? 'Dalam Panggilan' : 
           call.status === 'ringing' ? 'Berdering' : 
           call.status === 'calling' ? 'Memanggil' : 
           call.status === 'ended' ? 'Berakhir' : '';
  };

  const getCallTypeText = (type: CallType) => {
    return type === 'audio' ? 'Panggilan Suara' : 'Panggilan Video';
  };

  // TODO: Dalam implementasi sebenarnya, sebaiknya memeriksa ketersediaan nomor
  // dan memvalidasi melalui backend sebelum membuat panggilan
  const handleCallBack = (number: string, type: CallType) => {
    // Validasi nomor telepon sebelum memulai panggilan
    if (!number.trim()) {
      console.error('Nomor telepon tidak valid');
      return;
    }
    
    makeCall(number, type);
  };

  if (calls.length === 0) {
    return (
      <div className="text-center p-8 text-secondary-500">
        <FiPhone className="mx-auto text-4xl mb-2 text-secondary-400" />
        <p>Belum ada riwayat panggilan</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 divide-y divide-secondary-100">
      {calls.map((call) => (
        <div
          key={call.id}
          className="p-3 hover:bg-secondary-50 rounded-md cursor-pointer"
          onClick={() => handleCallBack(call.phoneNumber, call.type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4 text-xl">
                {getCallIcon(call)}
              </div>
              
              <div>
                <h3 className="font-medium">{formatPhoneNumber(call.phoneNumber)}</h3>
                <div className="flex items-center text-sm text-secondary-500">
                  <span>{formatCallDate(call.startTime)}</span>
                  {detailed && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="capitalize">{call.direction === 'incoming' ? 'Masuk' : 'Keluar'}</span>
                    </>
                  )}
                </div>
                {detailed && (
                  <div className="mt-1 flex items-center text-xs text-secondary-600">
                    <FiInfo className="mr-1" />
                    <span>{getCallTypeText(call.type)}</span>
                    <span className="mx-1">•</span>
                    <span>{getCallStatusText(call)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium flex items-center">
                <FiClock className="mr-1 text-secondary-400" />
                {formatDuration(call.duration || 0)}
              </div>
              {!detailed && (
                <p className="text-xs text-secondary-500 capitalize">
                  {call.direction === 'incoming' ? 'Masuk' : 'Keluar'}
                </p>
              )}
              {detailed && call.result && (
                <p className={`text-xs mt-1 ${
                  call.result === 'missed' || call.result === 'rejected' 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {call.result === 'missed' ? 'Tidak Dijawab' : 
                   call.result === 'rejected' ? 'Ditolak' : 
                   'Berhasil'}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}