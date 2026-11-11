import { Link, usePage } from '@inertiajs/react';
import { FILTER_KEYS } from '@/components/record-filters';
import { cn } from '@/lib/utils';

export type ViewPill = {
    value: string;
    label: string;
};

export function ViewPills({
    views,
    current,
}: {
    views: ViewPill[];
    current: string;
}) {
    // The page URL, not window.location: the address bar updates after render.
    const [pathname, query = ''] = usePage().url.split('?');

    const hrefFor = (value: string) => {
        const params = new URLSearchParams(query);

        ['view', 'page', 'sort', 'direction', 'search', ...FILTER_KEYS].forEach(
            (key) => params.delete(key),
        );
        params.set('view', value);

        return `${pathname}?${params.toString()}`;
    };

    return (
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
            {views.map((view) => (
                <Link
                    key={view.value}
                    href={hrefFor(view.value)}
                    preserveScroll
                    className={cn(
                        'rounded-sm px-3 py-1 text-xs font-semibold transition-colors',
                        current === view.value
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {view.label}
                </Link>
            ))}
        </div>
    );
}
