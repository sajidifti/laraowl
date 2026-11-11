import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { HANDLED_FILTER, RecordFilters } from '@/components/record-filters';
import { RelatedRecordsTable } from '@/components/related-records-table';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ViewPills } from '@/components/view-pills';
import { useLiveReload } from '@/hooks/use-live-reload';
import AppLayout from '@/layouts/app-layout';
import { timeAxis, valueAxis } from '@/lib/chart-axes';
import { monitoringQuery } from '@/lib/monitoring-query';
import { formatCompactNumber } from '@/lib/utils';
import { show as showException } from '@/routes/exceptions';
import { show as showRecord } from '@/routes/records';

export default function ExceptionsIndex({
    exceptions,
    search,
    view = 'raw',
    filters = {},
    timeSeries = [],
    overview,
    period,
    from,
    to,
}: {
    exceptions: any;
    search?: string | null;
    view?: string;
    filters?: Record<string, string | null>;
    timeSeries: any;
    stats: any;
    overview: any;
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

    const data = exceptions.data || [];
    const exceptionDetailsHref = (hash: string | number) =>
        showException.url(
            {
                current_team: teamSlug,
                project: projectSlug,
                hash,
            },
            monitoringQuery({ period, from, to }),
        );

    return (
        <>
            <Head title="Exceptions" />

            <div className="mb-5 space-y-4"></div>

            <div className="space-y-5">
                {/* Stats Card */}
                <Card className="overflow-hidden border-border bg-card shadow-xs">
                    <CardContent className="p-4">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <div className="text-2xl font-bold text-foreground">
                                    {formatCompactNumber(overview.total)}
                                </div>
                            </div>
                        </div>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeries}>
                                    <XAxis {...timeAxis()} />
                                    <YAxis {...valueAxis('Exceptions')} />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (
                                                active &&
                                                payload &&
                                                payload.length
                                            ) {
                                                return (
                                                    <div className="rounded-lg border border-border bg-background/95 p-2 shadow-xl backdrop-blur-sm">
                                                        <div className="mb-1.5 border-b border-border/50 pb-1 text-[9px] font-bold tracking-tight text-muted-foreground uppercase">
                                                            {
                                                                payload[0]
                                                                    .payload
                                                                    .minute
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                                                Exceptions:
                                                            </span>
                                                            <span className="text-[10px] font-bold text-foreground">
                                                                {formatCompactNumber(
                                                                    payload[0]
                                                                        .value,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="server_error"
                                        name="Exceptions"
                                        fill="#ef4444"
                                        radius={[2, 2, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <ViewPills
                                current={view}
                                views={[
                                    { value: 'raw', label: 'Raw' },
                                    { value: 'grouped', label: 'By Exception' },
                                ]}
                            />
                            <SearchInput
                                value={search}
                                placeholder={
                                    view === 'raw'
                                        ? 'Search class, message, file...'
                                        : 'Search class or message...'
                                }
                            />
                            {view === 'raw' && (
                                <RecordFilters
                                    filters={[HANDLED_FILTER]}
                                    values={filters}
                                />
                            )}
                        </div>
                        <span className="font-bold text-foreground">
                            {formatCompactNumber(exceptions.total || 0)}{' '}
                            {view === 'raw'
                                ? 'Occurrences'
                                : 'Unique Exceptions'}
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        {data.length > 0 && view === 'raw' ? (
                            <>
                                <RelatedRecordsTable
                                    type="exception"
                                    records={data}
                                    hrefFor={(record) =>
                                        showRecord.url({
                                            current_team: teamSlug,
                                            project: projectSlug,
                                            record,
                                        })
                                    }
                                    showDate
                                    showSource
                                />
                                <Pagination
                                    links={exceptions.links}
                                    meta={exceptions}
                                />
                            </>
                        ) : data.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">
                                                Last Seen
                                            </TableHead>
                                            <TableHead>Exception</TableHead>
                                            <TableHead className="w-[100px] text-right">
                                                Count
                                            </TableHead>
                                            <TableHead className="w-[100px] text-right">
                                                Users
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((exc: any, index: number) => (
                                            <TableRow
                                                key={index}
                                                className="group border-border transition-colors hover:bg-muted/30"
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {new Date(
                                                        exc.last_seen,
                                                    ).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={exceptionDetailsHref(
                                                            exc.hash,
                                                        )}
                                                    >
                                                        <div className="flex cursor-pointer flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="rounded-sm border-red-500/20 bg-red-500/10 px-1.5 py-0 text-[10px] font-bold text-red-500 uppercase">
                                                                    UNHANDLED
                                                                </Badge>
                                                                <span className="font-mono text-xs font-bold text-foreground transition-colors group-hover:text-foreground">
                                                                    {exc.class}
                                                                </span>
                                                            </div>
                                                            <span className="max-w-2xl truncate text-xs text-muted-foreground">
                                                                {exc.message}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                                                    {formatCompactNumber(
                                                        exc.total_count || 0,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-foreground/60">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>
                                                            {formatCompactNumber(
                                                                exc.user_count ||
                                                                    0,
                                                            )}
                                                        </span>
                                                        <Link
                                                            href={exceptionDetailsHref(
                                                                exc.hash,
                                                            )}
                                                        >
                                                            <div className="rounded border border-border bg-muted p-1 transition-all group-hover:border-border">
                                                                <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={exceptions.links}
                                    meta={exceptions}
                                />
                            </>
                        ) : (
                            <div className="p-12">
                                <EmptyState
                                    title="No Exceptions Detected"
                                    description="Great news! We haven't tracked any exceptions for this project. Keep up the high code quality."
                                    icon={AlertCircle}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ExceptionsIndex.layout = (page: any) => (
    <AppLayout
        children={page}
        breadcrumbs={[{ title: 'Exceptions', href: '#' }]}
    />
);
