import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useLiveReload } from '@/hooks/use-live-reload';
import AppLayout from '@/layouts/app-layout';
import { monitoringQuery } from '@/lib/monitoring-query';
import { show as showMail } from '@/routes/mail';

export default function MailIndex({
    mailables,
    search,
    period,
    from,
    to,
}: {
    mailables: any;
    search?: string | null;
    period?: string | null;
    from?: string | null;
    to?: string | null;
}) {
    const { props }: any = usePage();
    const teamSlug = props.current_team?.slug || props.currentTeam?.slug;
    const currentProject = props.current_project || props.currentProject;
    const projectSlug =
        props.current_project?.slug || props.currentProject?.slug;

    useLiveReload(currentProject?.id);

    const data = mailables.data || [];
    const mailDetailsHref = (hash: string | number) =>
        showMail.url(
            {
                current_team: teamSlug,
                project: projectSlug,
                hash,
            },
            monitoringQuery({ period, from, to }),
        );

    return (
        <>
            <Head title="Mail" />

            <div className="mb-5 space-y-4"></div>

            {/* Table Section */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <SearchInput
                        value={search}
                        placeholder={'Search mailable...'}
                    />
                    <div className="flex items-center gap-2 font-bold text-foreground">
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                        <span>{mailables.total || 0} Mailables</span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    {data.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mailable</TableHead>
                                        <TableHead className="text-center">
                                            Queued
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Direct
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Total
                                        </TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((mail: any, index: number) => (
                                        <TableRow
                                            key={index}
                                            className="group border-border transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell>
                                                <Link
                                                    href={mailDetailsHref(
                                                        mail.hash,
                                                    )}
                                                >
                                                    <div className="flex cursor-pointer flex-col gap-0.5">
                                                        <span className="max-w-md truncate font-mono text-xs text-foreground/90 transition-colors group-hover:text-foreground">
                                                            {
                                                                mail.mailable_class
                                                            }
                                                        </span>
                                                        <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                                                            APP\MAIL
                                                        </span>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="border-none bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                                                >
                                                    {mail.queued_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs text-foreground/60">
                                                {mail.total - mail.queued_count}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                                                {mail.total}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={mailDetailsHref(
                                                        mail.hash,
                                                    )}
                                                >
                                                    <div className="cursor-pointer rounded border border-border bg-muted p-1 transition-all group-hover:border-border">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    </div>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                links={mailables.links}
                                meta={mailables}
                            />
                        </>
                    ) : (
                        <div className="p-12">
                            <EmptyState
                                title="No Mail Sent"
                                description="We haven't tracked any outgoing mail activity for this project yet."
                                icon={Inbox}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

MailIndex.layout = (page: any) => (
    <AppLayout children={page} breadcrumbs={[{ title: 'Mail', href: '#' }]} />
);
