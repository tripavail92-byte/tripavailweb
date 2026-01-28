import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './providers';
import { RoleTransitionWrapper } from '@/components/RoleTransitionWrapper';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { RoleDrawer } from '@/components/navigation/RoleDrawer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TripAvail',
  description: 'Two-sided travel marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <RoleTransitionWrapper>
            <RoleDrawer />
            {children}
            <BottomNavigation />
          </RoleTransitionWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
