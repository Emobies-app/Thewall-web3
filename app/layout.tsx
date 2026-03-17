import { EmowallAIChat } from '@/components/EmowallButterfly';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <EmowallAIChat />  {/* ← butterfly FAB globally */}
      </body>
    </html>
  );
}
