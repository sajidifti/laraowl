import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { SharedData } from '@/types';

export default function AppLogo() {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="group flex cursor-pointer items-center gap-2">
            <div className="flex aspect-square size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-900 p-0.5 ring-1 ring-white/10">
                <AppLogoIcon className="size-full object-contain" />
            </div>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {name}
                </span>
                <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                    Monitoring
                </span>
            </div>
        </div>
    );
}
