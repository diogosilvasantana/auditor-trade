import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Trade Auditor Pro',
    description: 'Auditoria e planejamento disciplinado de day trade.',
};

import { AccountProvider } from '@/lib/AccountContext';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <AccountProvider>
                    {children}
                </AccountProvider>
            </body>
        </html>
    );
}
