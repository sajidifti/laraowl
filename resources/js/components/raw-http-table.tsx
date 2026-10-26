import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatMicroSeconds } from '@/lib/utils';
import { show as showRecord } from '@/routes/records';

const methodColor = (method?: string) =>
    ({
        GET: 'text-blue-400',
        POST: 'text-emerald-400',
        PUT: 'text-yellow-400',
        PATCH: 'text-yellow-400',
        DELETE: 'text-red-400',
    })[method?.toUpperCase() ?? ''] ?? 'text-muted-foreground';

const statusColor = (status?: number) => {
    if (!status) {
        return 'text-muted-foreground';
    }

    if (status >= 500) {
        return 'text-red-500';
    }

    if (status >= 400) {
        return 'text-orange-500';
    }

    return 'text-emerald-500';
};

const pathOf = (url?: string) => {
    if (!url) {
        return '/';
    }

    try {
        const parsed = new URL(url);

        return parsed.pathname + parsed.search;
    } catch {
        return url;
    }
};

export function RawHttpTable({
    records,
    showHost = false,
}: {
    records: any[];
    showHost?: boolean;
}) {
    const { props }: any = usePage();
    const teamSlug = props.current_team?.slug || props.currentTeam?.slug;
    const projectSlug =
        props.current_project?.slug || props.currentProject?.slug;

    const recordHref = (id: number) =>
        showRecord.url({
            current_team: teamSlug,
            project: projectSlug,
            record: id,
        });

    return (
        <Table>
            <TableHeader className="bg-muted/30">
                <TableRow className="border-border text-[10px] font-bold text-muted-foreground uppercase hover:bg-transparent">
                    <TableHead className="pl-6">Time</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>{showHost ? 'URL' : 'Path'}</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map((record) => {
                    const payload = record.payload || {};
                    const status = Number(
                        payload.status_code || payload.status || 0,
                    );

                    return (
                        <TableRow
                            key={record.id}
                            className="group border-border transition-colors hover:bg-muted/30"
                        >
                            <TableCell className="pl-6 font-mono text-xs whitespace-nowrap text-muted-foreground">
                                {new Date(record.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell
                                className={`text-[10px] font-bold uppercase ${methodColor(payload.method)}`}
                            >
                                {payload.method}
                            </TableCell>
                            <TableCell className="max-w-[520px]">
                                <Link
                                    href={recordHref(record.id)}
                                    className="line-clamp-1 font-mono text-xs break-all text-foreground/90 hover:underline"
                                    title={payload.url}
                                >
                                    {showHost
                                        ? payload.url
                                        : pathOf(payload.url)}
                                </Link>
                            </TableCell>
                            <TableCell
                                className={`text-center font-mono text-xs font-bold ${statusColor(status)}`}
                            >
                                {status || '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-foreground/90">
                                {formatMicroSeconds(payload.duration)}
                            </TableCell>
                            <TableCell>
                                <Link href={recordHref(record.id)}>
                                    <div className="rounded border border-border bg-muted p-1 transition-all group-hover:border-border">
                                        <ArrowUpRight className="h-3 w-3" />
                                    </div>
                                </Link>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
