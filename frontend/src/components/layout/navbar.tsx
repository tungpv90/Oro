'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Oro
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/explore" className="text-sm text-gray-700 hover:text-primary-600">
              Explore
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-sm text-gray-700 hover:text-primary-600">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-500">{session.user?.email}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
