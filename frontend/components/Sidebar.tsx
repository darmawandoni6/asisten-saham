'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BookOpen, Briefcase, HelpCircle, LayoutDashboard, LifeBuoy, Search, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'Smart Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Portofolio & Plan',
    href: '/portfolio',
    icon: Briefcase,
  },
  {
    label: 'Recovery Engine',
    href: '/recovery',
    icon: LifeBuoy,
  },
  {
    label: 'EOD Screener',
    href: '/screener',
    icon: Search,
  },
  {
    label: 'Trading Journal',
    href: '/journal',
    icon: BookOpen,
  },
  {
    label: 'Panduan Cara Pakai',
    href: '/guide',
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <BaseSidebar
      collapsible="none"
      className="w-64 h-screen max-h-screen sticky top-0 bg-white border-r border-slate-200 shrink-0 shadow-xs z-20 flex flex-col justify-between"
    >
      {/* 1. Header (Brand Logo & Name) */}
      <SidebarHeader className="h-16 px-5 flex flex-row items-center gap-3 bg-white shrink-0 space-y-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-2xs text-white shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-slate-900 text-sm tracking-tight truncate">Asisten Saham</h1>
            <Badge variant="emerald" className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase shrink-0">
              IDX
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">EOD Decision Copilot</p>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* 2. Scrollable Navigation Content */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="p-0 space-y-4">
          <div>
            <SidebarGroupLabel className="px-3 mb-1">Menu Utama</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map(item => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors shrink-0',
                              isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>

          {/* EOD Session Schedule Card */}
          <Card className="bg-slate-50/80 border-slate-200/80 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-slate-700 text-xs font-bold mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Siklus Kerja EOD</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Evaluasi otomatis aktif setiap <span className="font-semibold text-slate-800">17:30 WIB</span> setelah
                penutupan bursa IDX untuk aksi esok hari.
              </p>
            </CardContent>
          </Card>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* 3. Footer (AI Copilot Status) */}
      <SidebarFooter className="p-3 bg-white shrink-0">
        <Card className="bg-slate-50/80 border-slate-200/80 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>AI Copilot</span>
              </div>
              <Badge variant="emerald" className="text-[9px] px-1.5 py-0 h-4 font-semibold">
                Aktif
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mengevaluasi closing bursa jam 17:30 WIB secara objektif.
            </p>
          </CardContent>
        </Card>
      </SidebarFooter>
    </BaseSidebar>
  );
}
