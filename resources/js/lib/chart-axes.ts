import { formatCompactNumber, formatMicroSeconds } from '@/lib/utils';

const tick = { fontSize: 10, fill: 'var(--muted-foreground)' };

const axisLabel = { fontSize: 10, fill: 'var(--muted-foreground)' };

// Buckets arrive as "HH:MM", "MM-DD" or "YYYY-MM-DD HH:00" depending on the period.
const formatBucket = (value: string) => {
    const hourly = /^\d{4}-(\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(String(value));

    return hourly ? `${hourly[1]} ${hourly[2]}` : String(value);
};

export const formatIsoTime = (value: string) =>
    new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
    });

export const formatDuration = (value: number) => formatMicroSeconds(value);

/**
 * Props for a time X axis: visible ticks and a "Time (UTC)" title.
 */
export function timeAxis(
    dataKey = 'minute',
    tickFormatter: (value: any) => string = formatBucket,
) {
    return {
        dataKey,
        tick,
        tickFormatter,
        axisLine: false,
        tickLine: false,
        tickMargin: 4,
        minTickGap: 28,
        height: 32,
        label: {
            value: 'Time (UTC)',
            position: 'insideBottom' as const,
            offset: 0,
            style: axisLabel,
        },
    };
}

/**
 * Props for a value Y axis titled with what it measures.
 */
export function valueAxis(
    title: string,
    tickFormatter: (value: number) => string = (value) =>
        formatCompactNumber(value),
) {
    return {
        tick,
        tickFormatter,
        axisLine: false,
        tickLine: false,
        allowDecimals: false,
        width: 52,
        label: {
            value: title,
            angle: -90,
            position: 'insideLeft' as const,
            style: { ...axisLabel, textAnchor: 'middle' as const },
        },
    };
}
