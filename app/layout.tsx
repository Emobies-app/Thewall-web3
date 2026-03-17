import { EmowallAIChat } from '@/components/EmowallButterfly';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <EmowallAIChat />
      </body>
    </html>
  );
}
