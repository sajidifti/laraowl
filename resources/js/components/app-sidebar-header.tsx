import { usePage } from '@inertiajs/react';
import { AppearanceToggle } from '@/components/appearance-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { TimeFilter } from '@/components/time-filter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs: providedBreadcrumbs,
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { props }: any = usePage();
    const breadcrumbs =
        providedBreadcrumbs && providedBreadcrumbs.length > 0
            ? providedBreadcrumbs
            : props.breadcrumbs || [];

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md transition-all md:px-4">
            <div className="flex items-center gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SidebarTrigger className="-ml-1" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start">
                        Toggle Sidebar (Ctrl/⌘ + B)
                    </TooltipContent>
                </Tooltip>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <TimeFilter />
                <AppearanceToggle />
            </div>
        </header>
    );
}
