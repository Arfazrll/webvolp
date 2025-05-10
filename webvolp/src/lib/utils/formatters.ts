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
 * Format Indonesian month name for displayed date
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
 * Format phone number (adds spaces for readability)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Simple formatting for Indonesian numbers
  // Example: 081234567890 -> 0812 3456 7890
  if (!phoneNumber) return '';
  
  if (phoneNumber.startsWith('+62')) {
    // Handle +62 format
    const cleaned = phoneNumber.slice(3); // Remove +62
    return `+62 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  } else if (phoneNumber.startsWith('62')) {
    // Handle 62 format (without +)
    const cleaned = phoneNumber.slice(2); // Remove 62
    return `62 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  } else if (phoneNumber.startsWith('0')) {
    // Handle 0 format (standard Indonesian format)
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 8)} ${phoneNumber.slice(8)}`;
  }
  
  // If no specific format is detected, just add spaces every 4 digits
  const chunks = [];
  for (let i = 0; i < phoneNumber.length; i += 4) {
    chunks.push(phoneNumber.slice(i, i + 4));
  }
  
  return chunks.join(' ');
}