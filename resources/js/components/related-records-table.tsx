import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatMicroSeconds } from '@/lib/utils';

type Column = {
    label: string;
    render: (payload: any) => ReactNode;
    className?: string;
};

const mono = 'font-mono text-xs text-foreground/90';
const wide = `${mono} max-w-[480px] truncate`;

const statusColor = (status?: number) =>
    !status
        ? 'text-muted-foreground'
        : status >= 500
          ? 'text-red-500'
          : status >= 400
            ? 'text-orange-500'
            : 'text-emerald-500';

const duration: Column = {
    label: 'Duration',
    className: 'text-right',
    render: (p) => (p.duration != null ? formatMicroSeconds(p.duration) : '—'),
};

const columns: Record<string, Column[]> = {
    'outgoing-request': [
        {
            label: 'Method',
            className: 'text-[10px] font-bold uppercase',
            render: (p) => p.method,
        },
        { label: 'URL', className: wide, render: (p) => p.url || p.host },
        {
            label: 'Status',
            className: 'text-center font-mono text-xs font-bold',
            render: (p) => {
                const status = Number(p.status_code || p.status || 0);

                return (
                    <span className={statusColor(status)}>
                        {status || p.status || '—'}
                    </span>
                );
            },
        },
        duration,
    ],
    query: [
        { label: 'Query', className: wide, render: (p) => p.sql },
        { label: 'Connection', className: mono, render: (p) => p.connection },
        duration,
    ],
    'cache-event': [
        {
            label: 'Event',
            className: 'text-[10px] font-bold uppercase',
            render: (p) => p.type,
        },
        { label: 'Key', className: wide, render: (p) => p.key },
        { label: 'Store', className: mono, render: (p) => p.store },
    ],
    mail: [
        { label: 'Mailable', className: mono, render: (p) => p.class },
        { label: 'Subject', className: wide, render: (p) => p.subject },
        { label: 'Mailer', className: mono, render: (p) => p.mailer },
    ],
    notification: [
        { label: 'Notification', className: wide, render: (p) => p.class },
        { label: 'Channel', className: mono, render: (p) => p.channel },
    ],
    'queued-job': [
        {
            label: 'Job',
            className: wide,
            render: (p) => p.name || p.job || p.job_class,
        },
        { label: 'Connection', className: mono, render: (p) => p.connection },
        { label: 'Queue', className: mono, render: (p) => p.queue },
    ],
    log: [
        {
            label: 'Level',
            className: 'text-[10px] font-bold uppercase',
            render: (p) => p.level,
        },
        { label: 'Message', className: wide, render: (p) => p.message },
    ],
    exception: [
        { label: 'Class', className: mono, render: (p) => p.class },
        { label: 'Message', className: wide, render: (p) => p.message },
    ],
};

export function RelatedRecordsTable({
    type,
    records,
    hrefFor,
}: {
    type: string;
    records: any[];
    hrefFor: (id: number) => string;
}) {
    const typeColumns = columns[type] ?? [
        {
            label: 'Details',
            className: wide,
            render: (p: any) => p.message || JSON.stringify(p),
        },
    ];

    return (
        <Table>
            <TableHeader className="bg-muted/30">
                <TableRow className="border-border text-[10px] font-bold text-muted-foreground uppercase hover:bg-transparent">
                    <TableHead className="pl-4">Time</TableHead>
                    {typeColumns.map((column) => (
                        <TableHead
                            key={column.label}
                            className={
                                column.className?.includes('text-right')
                                    ? 'text-right'
                                    : column.className?.includes('text-center')
                                      ? 'text-center'
                                      : undefined
                            }
                        >
                            {column.label}
                        </TableHead>
                    ))}
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {records.map((record) => {
                    const payload = record.payload || {};

                    return (
                        <TableRow
                            key={record.id}
                            className="group border-border transition-colors hover:bg-muted/30"
                        >
                            <TableCell className="pl-4 font-mono text-xs whitespace-nowrap text-muted-foreground">
                                {new Date(
                                    record.created_at,
                                ).toLocaleTimeString()}
                            </TableCell>
                            {typeColumns.map((column) => (
                                <TableCell
                                    key={column.label}
                                    className={column.className}
                                >
                                    {column.render(payload) ?? '—'}
                                </TableCell>
                            ))}
                            <TableCell>
                                <Link href={hrefFor(record.id)}>
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
