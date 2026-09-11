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
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        <HeartbeatSender />
        <SidebarProvider defaultOpen={true} className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <SidebarInset className="flex h-screen w-full max-w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-slate-50">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
