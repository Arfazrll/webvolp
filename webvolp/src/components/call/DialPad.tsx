import React, { useState } from 'react';
import { FiPhone, FiVideo, FiDelete } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { useCall } from '@/lib/hooks/useCall';

export function DialPad() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { makeCall } = useCall();

  const handleKeyPress = (key: string) => {
    setPhoneNumber(prev => prev + key);
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  // Menghapus fungsi handleClear yang tidak digunakan
  // atau bisa juga ditambahkan fungsionalitasnya di suatu tempat

  const handleCall = (type: 'audio' | 'video') => {
    if (phoneNumber.trim()) {
      makeCall(phoneNumber, type);
    }
  };

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '*', '0', '#'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 text-xl text-center font-medium border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter phone number"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {keys.map((key) => (
          <Button
            key={key}
            variant="outline"
            size="lg"
            className="aspect-square text-xl font-medium"
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={handleDelete}
          disabled={!phoneNumber}
          className="text-red-500"
        >
          <FiDelete size={20} />
        </Button>

        <Button
          variant="default"
          size="icon-lg"
          className="bg-green-500 hover:bg-green-600"
          onClick={() => handleCall('audio')}
          disabled={!phoneNumber}
        >
          <FiPhone size={20} />
        </Button>

        <Button
          variant="secondary"
          size="icon-lg"
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={() => handleCall('video')}
          disabled={!phoneNumber}
        >
          <FiVideo size={20} />
        </Button>
      </div>
    </div>
  );
}