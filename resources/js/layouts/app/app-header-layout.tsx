import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header" className="min-h-screen bg-background">
                <div className="mx-auto w-full max-w-[1800px] animate-in space-y-4 p-4 duration-300 fade-in md:px-5">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
