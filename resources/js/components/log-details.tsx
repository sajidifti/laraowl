import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Check,
    Copy,
    Globe,
    Terminal,
    WrapText,
} from 'lucide-react';
import { useState } from 'react';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlock } from '@/components/code-block';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn, formatValue } from '@/lib/utils';

export const levelColor = (level: string = 'info') => {
    const value = level.toLowerCase();

    if (['error', 'critical', 'alert', 'emergency'].includes(value)) {
        return 'text-red-500';
    }

    return (
        {
            warning: 'text-orange-500',
            notice: 'text-yellow-500',
            info: 'text-blue-500',
            debug: 'text-purple-500',
        }[value] ?? 'text-muted-foreground'
    );
};

export const logSource = (payload: any): string =>
    payload.execution_preview ||
    (payload.method ? `${payload.method} ${payload.path}` : payload.command) ||
    'System';

const parseContext = (context: unknown) => {
    if (typeof context !== 'string') {
        return context;
    }

    try {
        return JSON.parse(context);
    } catch {
        return context;
    }
};

const isEmptyValue = (value: unknown) =>
    value == null ||
    value === '' ||
    (typeof value === 'object' && Object.keys(value).length === 0);

/**
 * A context/extra value as Monolog's LineFormatter prints it: compact JSON,
 * `[]` when empty, and escaped line breaks (stack traces) rendered as real ones.
 */
const lineJson = (value: unknown) => {
    if (isEmptyValue(value)) {
        return '[]';
    }

    const json =
        typeof value === 'object' ? JSON.stringify(value) : formatValue(value);

    return json.replace(/(?<!\\)(?:\\r)?\\n/g, '\n');
};

const logTimestamp = (payload: any) => {
    const date = payload.timestamp
        ? new Date(Number(payload.timestamp) * 1000)
        : null;

    return date && !Number.isNaN(date.getTime())
        ? date.toISOString().slice(0, 19).replace('T', ' ')
        : '';
};

/**
 * The entry the way storage/logs/laravel.log shows it:
 * `[2026-01-01 10:00:00] ERROR: message {"context":true} []`.
 */
function LogLine({
    payload,
    context,
    extra,
}: {
    payload: any;
    context: unknown;
    extra: unknown;
}) {
    const [wrapped, setWrapped] = useState(true);
    const [copied, copy] = useClipboard();
    const level = String(payload.level || 'info').toUpperCase();
    const timestamp = logTimestamp(payload);
    const tail = `${lineJson(context)} ${lineJson(extra)}`;
    const text = `${timestamp ? `[${timestamp}] ` : ''}${level}: ${payload.message ?? ''} ${tail}`;

    const button =
        'flex size-6 items-center justify-center rounded-md border border-border bg-background/80 backdrop-blur-sm transition-colors hover:text-foreground';

    return (
        <div className="relative min-w-0">
            <div className="absolute top-1.5 right-1.5 z-10 flex gap-1">
                <button
                    type="button"
                    onClick={() => copy(text)}
                    title="Copy log line"
                    className={cn(button, 'text-muted-foreground')}
                >
                    {copied === text ? (
                        <Check className="size-3.5 text-green-500" />
                    ) : (
                        <Copy className="size-3.5" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setWrapped(!wrapped)}
                    title={wrapped ? 'Disable line wrap' : 'Wrap lines'}
                    aria-pressed={wrapped}
                    className={cn(
                        button,
                        wrapped ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    <WrapText className="size-3.5" />
                </button>
            </div>
            <pre
                className={cn(
                    'max-h-[55vh] overflow-auto rounded-md border border-border bg-muted/40 p-3 pr-16 font-mono text-xs leading-relaxed',
                    wrapped
                        ? '[overflow-wrap:anywhere] break-words whitespace-pre-wrap'
                        : 'whitespace-pre',
                )}
            >
                {timestamp && (
                    <span className="text-muted-foreground">
                        [{timestamp}]{' '}
                    </span>
                )}
                <span className={cn('font-bold', levelColor(payload.level))}>
                    {level}
                </span>
                <span className="text-muted-foreground">: </span>
                <span className="text-foreground">{payload.message}</span>{' '}
                <span className="text-foreground/60">{tail}</span>
            </pre>
        </div>
    );
}

export function LogDetails({
    payload,
    sourceHref,
}: {
    payload: any;
    sourceHref?: string;
}) {
    const [view, setView] = useState<'line' | 'json'>('line');
    const context = parseContext(payload.context);
    const extra = parseContext(payload.extra);
    const isEmpty = isEmptyValue(context);
    const isCommand =
        String(payload.execution_source).toLowerCase() === 'command';
    const SourceIcon = isCommand ? Terminal : Globe;

    const source = (
        <>
            <SourceIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-mono text-xs text-foreground">
                {logSource(payload)}
            </span>
            <span className="ml-auto shrink-0 text-[10px] font-semibold text-muted-foreground uppercase">
                {payload.execution_source || 'request'}
                {payload.execution_stage && ` · ${payload.execution_stage}`}
            </span>
            {sourceHref && (
                <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
            )}
        </>
    );

    return (
        <div className="min-w-0 space-y-4 text-sm">
            <div className="space-y-1">
                <span
                    className={`text-[11px] font-bold uppercase ${levelColor(payload.level)}`}
                >
                    {payload.level || 'info'}
                </span>
                <p className="leading-relaxed font-medium break-words text-foreground">
                    {payload.message}
                </p>
            </div>

            <div className="space-y-1.5">
                <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Source
                </div>
                {sourceHref ? (
                    <Link
                        href={sourceHref}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 transition-colors hover:bg-muted"
                    >
                        {source}
                    </Link>
                ) : (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                        {source}
                    </div>
                )}
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Entry
                    </div>
                    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
                        {(
                            [
                                ['line', 'Log line'],
                                ['json', 'Context JSON'],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setView(value)}
                                className={cn(
                                    'rounded-sm px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                                    view === value
                                        ? 'bg-foreground text-background'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                {view === 'line' ? (
                    <LogLine
                        payload={payload}
                        context={context}
                        extra={extra}
                    />
                ) : isEmpty ? (
                    <p className="text-xs text-muted-foreground">
                        No context provided.
                    </p>
                ) : (
                    <CodeBlock
                        language="json"
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            maxHeight: '55vh',
                            overflow: 'auto',
                            fontSize: '12px',
                            borderRadius: 'var(--radius)',
                        }}
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {typeof context === 'object'
                            ? JSON.stringify(context, null, 2)
                            : formatValue(context)}
                    </CodeBlock>
                )}
            </div>
        </div>
    );
}
