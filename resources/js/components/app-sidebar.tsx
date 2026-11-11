import { Link, usePage } from '@inertiajs/react';

import {
    LayoutGrid,
    AlertCircle,
    Activity,
    Repeat,
    Terminal,
    Calendar,
    Zap,
    Search,
    Bell,
    Mail,
    Database,
    ExternalLink,
    Users,
    FileText,
    Settings,
    Globe,
    Shield,
    Lock as LockIcon,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import type { PageProps } from '@/types';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { props } = usePage<PageProps>();
    const teamSlug = props.currentTeam?.slug || '';

    const projects = (props as any).projects || [];
    const currentProject = (props as any).currentProject;
    const projectSlug =
        currentProject?.slug || (projects.length > 0 ? projects[0].slug : '');

    const currentPeriod = (props as any).period || '1h';
    const from = (props as any).from;
    const to = (props as any).to;

    const withPeriod = (url: string) => {
        if (!url || url === '#' || url.startsWith('http')) {
            return url;
        }

        const [base, query] = url.split('?');
        const searchParams = new URLSearchParams(query || '');

        searchParams.set('period', currentPeriod);

        if (from) {
            searchParams.set('from', from);
        }

        if (to) {
            searchParams.set('to', to);
        }

        return `${base}?${searchParams.toString()}`;
    };

    const dashboardUrl = projectSlug
        ? withPeriod(`/${teamSlug}/${projectSlug}/dashboard`)
        : teamSlug
          ? `/${teamSlug}/projects/create`
          : '/';

    const projectUrl = (path: string) =>
        withPeriod(`/${teamSlug}/${projectSlug}/${path}`);
    const item = (title: string, path: string, icon: NavItem['icon']) => ({
        title,
        href: projectUrl(path),
        icon,
    });

    const uptimeEnabled = currentProject?.uptime_monitoring_enabled ?? true;

    const navGroups: { label: string; items: NavItem[] }[] = [
        {
            label: 'Overview',
            items: [
                { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
                item('Issues', 'issues', AlertCircle),
                item('Exceptions', 'exceptions', Zap),
                item('Logs', 'logs', FileText),
            ],
        },
        {
            label: 'Traffic',
            items: [
                item('Requests', 'requests', Activity),
                item('Outgoing Requests', 'outgoing-requests', ExternalLink),
                item('Users', 'users', Users),
                ...(uptimeEnabled ? [item('Uptime', 'uptime', Globe)] : []),
            ],
        },
        {
            label: 'Data',
            items: [
                item('Queries', 'queries', Search),
                item('Cache', 'cache', Database),
            ],
        },
        {
            label: 'Background',
            items: [
                item('Jobs', 'jobs', Repeat),
                item('Scheduled Tasks', 'scheduled-tasks', Calendar),
                item('Commands', 'commands', Terminal),
            ],
        },
        {
            label: 'Messaging',
            items: [
                item('Mail', 'mail', Mail),
                item('Notifications', 'notifications', Bell),
            ],
        },
        {
            label: 'Security',
            items: [
                item('Security', 'security', Shield),
                item('Firewall', 'firewall', LockIcon),
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="gap-2 border-b border-sidebar-border p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="h-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-transparent"
                        >
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <WorkspaceSwitcher />
            </SidebarHeader>

            <SidebarContent className="custom-scrollbar gap-0 py-1">
                {navGroups.map((group) => (
                    <NavMain
                        key={group.label}
                        items={group.items}
                        label={group.label}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter className="gap-0 border-t border-sidebar-border px-0 py-1">
                <NavMain
                    items={[
                        {
                            title: 'Project Settings',
                            href: `/${teamSlug}/${projectSlug}/settings`,
                            icon: Settings,
                        },
                    ]}
                />
                <div className="px-2">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
