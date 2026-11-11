import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { UpdateBanner } from '@/components/update-banner';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-screen min-w-0 bg-background"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="mx-auto w-full max-w-[1800px] animate-in space-y-4 p-4 duration-300 fade-in md:px-5">
                    <UpdateBanner />
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
