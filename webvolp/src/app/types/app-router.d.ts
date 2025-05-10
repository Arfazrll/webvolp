import { ReactNode } from 'react';

// Mendefinisikan tipe yang lebih spesifik untuk nilai metadata
type MetadataValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | readonly MetadataValue[] 
  | { [key: string]: MetadataValue };

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: MetadataValue;
  }
}

// App Router Layout dan Page types
declare global {
  namespace React {
    interface LayoutProps {
      children: ReactNode;
    }

    interface PageProps {
      params?: Record<string, string | string[]>;
      searchParams?: Record<string, string | string[]>;
    }
  }
}

// Menambahkan definisi untuk app/layout.ts
declare module '*/app/layout' {
  import { ReactNode } from 'react';
  export default function RootLayout({ children }: { children: ReactNode }): JSX.Element;
  export const metadata: import('next').Metadata;
}

// Menambahkan definisi untuk app/**/page.ts
declare module '*/app/**/page' {
  export default function Page(props: React.PageProps): JSX.Element;
  export const metadata: import('next').Metadata;
}