import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { LogDetails, levelColor, logSource } from '@/components/log-details';
import { Pagination } from '@/components/pagination';
import { LEVEL_FILTER, RecordFilters } from '@/components/record-filters';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { formatCompactNumber } from '@/lib/utils';
import { execution, show as showRecord } from '@/routes/records';

export default function LogsIndex({
    records,
    filters = {},
}: {
    records: any;
    filters?: Record<string, string | null>;
}) {
    const data = records.data || [];
    const { props }: any = usePage();
    const currentProject = props.current_project || props.currentProject;
    const routeArgs = (record: number) => ({
        current_team: props.current_team?.slug || props.currentTeam?.slug,
        project: currentProject?.slug,
        record,
    });

    const [selectedLog, setSelectedLog] = useState<any>(null);

    useLiveReload(currentProject?.id);

    return (
        <>
            <Head title="Logs" />

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput
                        value={filters.search}
                        placeholder="Search log messages..."
                    />
                    <RecordFilters filters={[LEVEL_FILTER]} values={filters} />
                </div>
                <span className="text-xs text-muted-foreground">
                    {formatCompactNumber(records.total || 0)} logs
                </span>
            </div>

            {data.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="w-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((log: any) => (
                                <TableRow
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className="group cursor-pointer border-border"
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {new Date(
                                            log.created_at,
                                        ).toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className={`text-[10px] font-bold uppercase ${levelColor(log.payload.level)}`}
                                    >
                                        {log.payload.level || 'info'}
                                    </TableCell>
                                    <TableCell className="w-full max-w-0">
                                        <span
                                            className="block truncate text-xs text-foreground/90"
                                            title={log.payload.message}
                                        >
                                            {log.payload.message}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="border-border py-0 text-[9px] font-semibold text-muted-foreground uppercase"
                                            >
                                                {log.payload.execution_source ||
                                                    'request'}
                                            </Badge>
                                            <span
                                                className="max-w-[280px] truncate font-mono text-[11px] text-muted-foreground"
                                                title={logSource(log.payload)}
                                            >
                                                {logSource(log.payload)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={showRecord.url(
                                                routeArgs(log.id),
                                            )}
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                            title="Open details"
                                            className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <ArrowUpRight className="size-3.5" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination links={records.links} meta={records} />
                </div>
            ) : (
                <EmptyState
                    title="No Logs Found"
                    description="We haven't found any application logs matching your filters or for the selected period."
                    icon={FileText}
                />
            )}

            <Dialog
                open={selectedLog !== null}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            >
                <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-[min(90vw,1200px)] [&>*]:min-w-0">
                    {selectedLog && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-sm">
                                    Log entry
                                </DialogTitle>
                                <DialogDescription className="font-mono text-xs">
                                    {new Date(
                                        selectedLog.created_at,
                                    ).toLocaleString()}
                                </DialogDescription>
                            </DialogHeader>
                            <LogDetails
                                payload={selectedLog.payload}
                                sourceHref={execution.url(
                                    routeArgs(selectedLog.id),
                                )}
                            />
                            <DialogFooter>
                                <Button variant="outline" size="sm" asChild>
                                    <Link
                                        href={showRecord.url(
                                            routeArgs(selectedLog.id),
                                        )}
                                    >
                                        Open full details
                                    </Link>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LogsIndex.layout = (page: any) => (
    <AppLayout children={page} breadcrumbs={[{ title: 'Logs', href: '#' }]} />
);
