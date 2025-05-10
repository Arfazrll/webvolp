import { type ClassValue, clsx } from 'clsx';

// Implementasi fungsi twMerge sederhana karena tidak bisa mengimpor tailwind-merge
function twMerge(...classNames: string[]): string {
  return classNames.filter(Boolean).join(' ');
}

/**
 * Combine multiple class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a duration in seconds to a readable time string (mm:ss)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to a readable string
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateToFormat = new Date(date);
  const formatterTime = new Intl.DateTimeFormat('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  // If the date is today
  if (dateToFormat >= today) {
    return `Hari ini, ${formatterTime.format(dateToFormat)}`;
  }
  
  // If the date is yesterday
  if (dateToFormat >= yesterday && dateToFormat < today) {
    return `Kemarin, ${formatterTime.format(dateToFormat)}`;
  }
  
  // Otherwise, show the full date with Indonesian format
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return formatter.format(dateToFormat);
}

/**
 * Format month name for displayed date
 * TODO: Dalam implementasi sebenarnya, gunakan i18n untuk format yang lebih fleksibel
 */
export function formatMonthShort(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return months[month];
}

/**
 * Format date to short display (10 Mei, 07:30)
 */
export function formatShortDate(date?: Date): string {
  if (!date) return '';
  
  const d = new Date(date);
  const day = d.getDate();
  const month = formatMonthShort(d.getMonth());
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month}, ${hours}:${minutes}`;
}

/**
 * Format phone number for display
 * TODO: Dalam implementasi sebenarnya, gunakan library seperti libphonenumber-js
 * untuk memformat nomor telepon sesuai standar internasional
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Implementasi generik yang tidak mengasumsikan format tertentu
  try {
    // Strip out non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format dasar: kelompokkan per 4 digit
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      chunks.push(cleaned.slice(i, i + 4));
    }
    
    return chunks.join(' ');
  } catch (error) {
    // Fallback jika format gagal
    return phoneNumber;
  }
}