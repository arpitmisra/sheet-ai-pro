import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SheetAI Pro - Smart Collaborative Spreadsheets',
  description: 'Online collaborative spreadsheet platform with AI integration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
