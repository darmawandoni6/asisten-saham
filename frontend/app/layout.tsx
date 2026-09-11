import type { Metadata } from 'next';

import { HeartbeatSender } from '@/components/HeartbeatSender';
import { Sidebar } from '@/components/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import './globals.css';

export const metadata: Metadata = {
  title: 'Asisten Saham — IDX EOD Decision Copilot',
  description: 'Asisten Saham pintar harian untuk investor dan trader saham Bursa Efek Indonesia (IDX)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 flex h-screen overflow-hidden selection:bg-emerald-600 selection:text-white antialiased">
        <HeartbeatSender />
        <SidebarProvider defaultOpen={true} className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0 w-full max-w-full h-screen overflow-y-auto overflow-x-hidden bg-slate-50">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
