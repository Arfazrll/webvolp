import React from 'react';
import { FiPhone } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center md:flex-row md:justify-between">
          <div className="flex items-center">
            <FiPhone className="mr-2 text-primary-600" />
            <span className="text-sm text-secondary-600">
              VoIP Kamailio Web App
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}