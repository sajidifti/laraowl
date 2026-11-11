import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Debounced search box that keeps the term in the `search` query parameter.
 */
export function SearchInput({
    value,
    placeholder = 'Search...',
    className,
}: {
    value?: string | null;
    placeholder?: string;
    className?: string;
}) {
    const current = value ?? '';
    const [term, setTerm] = useState(current);
    const [synced, setSynced] = useState(current);

    if (synced !== current) {
        setSynced(current);
        setTerm(current);
    }

    useEffect(() => {
        const next = term.trim();

        if (next === current) {
            return;
        }

        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            params.delete('page');

            if (next) {
                params.set('search', next);
            } else {
                params.delete('search');
            }

            router.get(
                `${window.location.pathname}?${params.toString()}`,
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [term, current]);

    return (
        <div className={cn('relative w-full sm:w-64', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={placeholder}
                className="h-7 border-border bg-card pr-7 pl-7 text-xs"
            />
            {term && (
                <button
                    type="button"
                    onClick={() => setTerm('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}
