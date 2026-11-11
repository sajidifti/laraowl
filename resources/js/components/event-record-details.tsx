import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, CornerLeftUp } from 'lucide-react';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlock } from '@/components/code-block';
import { LogDetails } from '@/components/log-details';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatMicroSeconds, formatValue } from '@/lib/utils';
import { show as showRecord } from '@/routes/records';

// Transport fields every record carries; not useful to read.
const HIDDEN_FIELDS = [
    'v',
    't',
    'timestamp',
    'deploy',
    '_group',
    'trace_id',
    'execution_id',
    'execution_source',
    'execution_preview',
    'execution_stage',
    'sql',
    'context',
];

const DURATION_FIELDS = ['duration'];
const SIZE_FIELDS = ['request_size', 'response_size'];

const formatField = (key: string, value: unknown): string => {
    if (DURATION_FIELDS.includes(key) && typeof value === 'number') {
        return formatMicroSeconds(value);
    }

    if (SIZE_FIELDS.includes(key) && typeof value === 'number') {
        return `${(value / 1024).toFixed(2)} KB`;
    }

    return typeof value === 'object'
        ? JSON.stringify(value)
        : String(formatValue(value));
};

const titleFor = (type: string, payload: any): string =>
    ({
        query: 'Database Query',
        'outgoing-request': `${payload.method || ''} ${payload.url || payload.host || ''}`,
        mail: payload.subject || payload.class,
        notification: payload.class,
        'cache-event': `${payload.type || 'cache'} ${payload.key || ''}`,
        'queued-job': payload.name || payload.job || payload.job_class,
        exception: payload.class,
        log: 'Log entry',
    })[type] ||
    payload.message ||
    type;

const codeStyle = {
    margin: 0,
    fontSize: '12px',
    borderRadius: 'var(--radius)',
};

export function EventRecordDetails({
    record,
    parentRecord,
}: {
    record: any;
    parentRecord?: any;
}) {
    const { props }: any = usePage();
    const payload = record.payload || {};
    const parentPayload = parentRecord?.payload || {};
    const parentHref =
        parentRecord &&
        showRecord.url({
            current_team: props.current_team?.slug || props.currentTeam?.slug,
            project: props.current_project?.slug || props.currentProject?.slug,
            record: parentRecord.id,
        });
    const fields = Object.entries(payload).filter(
        ([key, value]) =>
            !HIDDEN_FIELDS.includes(key) && value !== null && value !== '',
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="text-[10px] font-semibold uppercase"
                        >
                            {record.type.replace('-', ' ')}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                            {new Date(record.created_at).toLocaleString()}
                        </span>
                    </div>
                    <h1 className="truncate text-lg font-semibold text-foreground">
                        {titleFor(record.type, payload)}
                    </h1>
                </div>
            </div>

            {parentHref ? (
                <Link
                    href={parentHref}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/50"
                >
                    <CornerLeftUp className="size-4 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {parentRecord.type.replace('-', ' ')}
                    </span>
                    <span className="truncate font-mono text-xs text-foreground">
                        {parentPayload.method
                            ? `${parentPayload.method} ${parentPayload.route_path || parentPayload.url}`
                            : parentPayload.command ||
                              parentPayload.name ||
                              parentPayload.job ||
                              payload.execution_preview}
                    </span>
                    {parentPayload.status_code && (
                        <span className="font-mono text-xs text-muted-foreground">
                            {parentPayload.status_code}
                        </span>
                    )}
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
                </Link>
            ) : (
                payload.execution_preview && (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
                        {payload.execution_preview} (execution not recorded)
                    </div>
                )
            )}

            {record.type === 'log' ? (
                <Card className="px-4">
                    <LogDetails payload={payload} sourceHref={parentHref} />
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-4">
                        {payload.sql && (
                            <CodeBlock
                                language="sql"
                                style={vscDarkPlus}
                                customStyle={codeStyle}
                                wrapLongLines={true}
                            >
                                {payload.sql}
                            </CodeBlock>
                        )}
                        <CodeBlock
                            language="json"
                            style={vscDarkPlus}
                            customStyle={codeStyle}
                            wrapLongLines={true}
                        >
                            {JSON.stringify(payload, null, 2)}
                        </CodeBlock>
                    </div>

                    <Card size="sm" className="h-fit gap-0 py-0">
                        {fields.map(([key, value]) => (
                            <div
                                key={key}
                                className="flex items-start justify-between gap-4 border-b border-border px-3 py-1.5 last:border-0"
                            >
                                <span className="shrink-0 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    {key.replaceAll('_', ' ')}
                                </span>
                                <span className="truncate text-right font-mono text-xs text-foreground/90">
                                    {formatField(key, value)}
                                </span>
                            </div>
                        ))}
                    </Card>
                </div>
            )}
        </div>
    );
}
