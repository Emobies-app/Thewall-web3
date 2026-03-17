import type { ReactNode } from 'react';
import { EmowallAIChat } from '@/components/EmowallButterfly';

export default function RootLayout({ children })  
  return (
    <html lang="en">
      <body>
        {children}
        <EmowallAIChat />
      </body>
    </html>
  );
}
