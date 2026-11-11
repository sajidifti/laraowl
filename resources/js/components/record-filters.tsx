import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type RecordFilter = {
    key: string;
    label: string;
    options: { value: string; label: string }[];
};

const ALL = '__all';

export const STATUS_FILTER: RecordFilter = {
    key: 'status',
    label: 'Status',
    options: [
        { value: '2xx', label: '2xx Success' },
        { value: '3xx', label: '3xx Redirect' },
        { value: '4xx', label: '4xx Client error' },
        { value: '5xx', label: '5xx Server error' },
        ...[401, 403, 404, 419, 422, 429, 500, 502, 503, 504].map((code) => ({
            value: String(code),
            label: String(code),
        })),
    ],
};

export const METHOD_FILTER: RecordFilter = {
    key: 'method',
    label: 'Method',
    options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({
        value: method,
        label: method,
    })),
};

export const LEVEL_FILTER: RecordFilter = {
    key: 'level',
    label: 'Level',
    options: [
        'emergency',
        'alert',
        'critical',
        'error',
        'warning',
        'notice',
        'info',
        'debug',
    ].map((level) => ({ value: level, label: level.toUpperCase() })),
};

export const HANDLED_FILTER: RecordFilter = {
    key: 'handled',
    label: 'Handled',
    options: [
        { value: 'no', label: 'Unhandled' },
        { value: 'yes', label: 'Handled' },
    ],
};

export const FILTER_KEYS = [
    'status',
    'method',
    'level',
    'connection',
    'handled',
];

export function RecordFilters({
    filters,
    values = {},
}: {
    filters: RecordFilter[];
    values?: Record<string, string | null | undefined>;
}) {
    const apply = (changes: Record<string, string | null>) => {
        const params = new URLSearchParams(window.location.search);

        params.delete('page');
        Object.entries(changes).forEach(([key, value]) =>
            value ? params.set(key, value) : params.delete(key),
        );

        router.get(
            `${window.location.pathname}?${params.toString()}`,
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const active = filters.filter((filter) => values[filter.key]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
                <Select
                    key={filter.key}
                    value={values[filter.key] ?? ALL}
                    onValueChange={(value) =>
                        apply({ [filter.key]: value === ALL ? null : value })
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-7 min-w-28 border-border bg-card text-xs"
                    >
                        <span className="text-muted-foreground">
                            {filter.label}:
                        </span>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL} className="text-xs">
                            All
                        </SelectItem>
                        {filter.options.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-xs"
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            {active.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={() =>
                        apply(
                            Object.fromEntries(
                                active.map((filter) => [filter.key, null]),
                            ),
                        )
                    }
                >
                    <X className="size-3" /> Clear
                </Button>
            )}
        </div>
    );
}
