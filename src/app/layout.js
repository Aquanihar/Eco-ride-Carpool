import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'Raahi — Smart Route-Based Carpooling',
  description:
    'Share rides with people heading the same way. Reduce pollution, split costs, and make every journey count with Raahi route-matching technology.',
  keywords: 'carpool, ride sharing, eco friendly, route matching, green commute',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#013db5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
