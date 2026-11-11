import { Link } from '@inertiajs/react';
import { ArrowUpRight, Globe, Terminal } from 'lucide-react';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlock } from '@/components/code-block';
import { formatValue } from '@/lib/utils';

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

export function LogDetails({
    payload,
    sourceHref,
}: {
    payload: any;
    sourceHref?: string;
}) {
    const context = parseContext(payload.context);
    const isEmpty =
        context == null ||
        context === '' ||
        (typeof context === 'object' && Object.keys(context).length === 0);
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
                <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Context
                </div>
                {isEmpty ? (
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
