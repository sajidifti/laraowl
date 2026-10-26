import { Link } from '@inertiajs/react';
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
    const hrefFor = (value: string) => {
        const params = new URLSearchParams(window.location.search);

        ['view', 'page', 'sort', 'direction', 'search'].forEach((key) =>
            params.delete(key),
        );
        params.set('view', value);

        return `${window.location.pathname}?${params.toString()}`;
    };

    return (
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            {views.map((view) => (
                <Link
                    key={view.value}
                    href={hrefFor(view.value)}
                    preserveScroll
                    className={cn(
                        'rounded-full px-4 py-1 text-xs font-bold transition-colors',
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
