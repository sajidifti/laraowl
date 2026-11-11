import { useCallback, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const STORAGE_KEY = 'appearance';
const DEFAULT_APPEARANCE: Appearance = 'dark';

const listeners = new Set<() => void>();
let currentAppearance: Appearance = DEFAULT_APPEARANCE;

const mediaQuery = (): MediaQueryList | null =>
    typeof window === 'undefined'
        ? null
        : window.matchMedia('(prefers-color-scheme: dark)');

const resolve = (appearance: Appearance): ResolvedAppearance => {
    if (appearance === 'system') {
        return mediaQuery()?.matches ? 'dark' : 'light';
    }

    return appearance;
};

const readStored = (): Appearance => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // Storage can be unavailable (private mode, blocked site data).
    }

    return DEFAULT_APPEARANCE;
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = resolve(appearance) === 'dark';

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${name}=${value};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
};

const notify = (): void => listeners.forEach((listener) => listener());

const handleSystemChange = (): void => {
    if (currentAppearance === 'system') {
        applyTheme('system');
        notify();
    }
};

export function initializeTheme(): void {
    currentAppearance = readStored();
    applyTheme(currentAppearance);
    mediaQuery()?.addEventListener('change', handleSystemChange);
}

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

export function useAppearance(): UseAppearanceReturn {
    const appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => DEFAULT_APPEARANCE,
    );

    const updateAppearance = useCallback((mode: Appearance): void => {
        currentAppearance = mode;

        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // Cookie below still carries the choice to the server.
        }

        setCookie(STORAGE_KEY, mode);
        applyTheme(mode);
        notify();
    }, []);

    return {
        appearance,
        resolvedAppearance: resolve(appearance),
        updateAppearance,
    } as const;
}
