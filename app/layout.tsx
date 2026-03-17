import type { ReactNode } from 'react';
import { EmowallAIChat } from '@/components/EmowallButterfly';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <EmowallAIChat />
      </body>
    </html>
  );
}
