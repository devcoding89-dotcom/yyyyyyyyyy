
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mailbox,
  Send,
  Settings,
  ShieldCheck,
  CreditCard,
  Home,
  FileText,
  Mail,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useUser } from "@/lib/supabase/provider";
import { useDoc } from "@/hooks/use-supabase-doc";
import { useMemoSupabaseDoc } from "@/hooks/use-memo-supabase";
import { SheetClose } from '@/components/ui/sheet';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/extract', label: 'Extract Intelligence', icon: Mailbox },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/send', label: 'Send Emails', icon: Mail },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/campaigns', label: 'Campaigns', icon: Send },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const userProfileQuery = useMemoSupabaseDoc({
    tableName: 'users',
    docId: user?.id || '',
  }, [user]);

  const { data: profile } = useDoc(userProfileQuery);

  return (
    <nav className="grid gap-6 text-lg font-medium">
      <SheetClose asChild>
        <Link
          href="/"
          className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
        >
          <Icons.logo className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">EmailCraft Studio</span>
        </Link>
      </SheetClose>
      
      {!user && (
        <SheetClose asChild>
          <Link
            href="/"
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              { 'text-foreground': pathname === '/' }
            )}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>
        </SheetClose>
      )}

      {user && navLinks.map(({ href, label, icon: Icon }) => (
        <SheetClose asChild key={href}>
          <Link
            href={href}
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              {
                'text-foreground':
                  (href === '/dashboard' && pathname === '/dashboard') ||
                  (href !== '/dashboard' && pathname.startsWith(href)),
              }
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        </SheetClose>
      ))}

      {profile?.isAdmin && (
        <SheetClose asChild>
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
              {
                'text-foreground': pathname.startsWith('/admin'),
              }
            )}
          >
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Admin Panel
          </Link>
        </SheetClose>
      )}

      <SheetClose asChild>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
            {
              'text-foreground': pathname.startsWith('/settings'),
            }
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </SheetClose>
    </nav>
  );
}
