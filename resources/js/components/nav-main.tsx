import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
    const { currentUrl, isCurrentUrl } = useCurrentUrl();

    // Detail pages (e.g. /requests/{hash}) keep their section highlighted.
    const isActive = (href: NavItem['href']) =>
        isCurrentUrl(href) ||
        currentUrl.startsWith(`${toUrl(href).split('?')[0]}/`);

    return (
        <SidebarGroup className="px-2 py-1">
            {label && (
                <SidebarGroupLabel className="h-6 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-px">
                {items.map((item) => {
                    const active = isActive(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                size="sm"
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'relative h-7 text-[13px]',
                                    active
                                        ? 'font-medium text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && (
                                        <item.icon
                                            className={
                                                active
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground'
                                            }
                                        />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
