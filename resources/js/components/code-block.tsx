import { WrapText } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import { useAppearance } from '@/hooks/use-appearance';

/**
 * Syntax highlighting for the few languages this app actually renders.
 *
 * The default `Prism` export of react-syntax-highlighter carries every
 * language it supports — around 600 kB of JavaScript, more than the rest of
 * the application put together — for pages that only ever show a JSON payload
 * a PHP stack frame or a SQL query. The light build ships the highlighter
 * alone and lets us register just those.
 */
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('sql', sql);

export type CodeLanguage = 'json' | 'php' | 'sql';

export function CodeBlock({
    language,
    style,
    customStyle,
    wrapLines = true,
    wrapLongLines = true,
    showLineNumbers,
    startingLineNumber,
    lineProps,
    children,
}: {
    language: CodeLanguage;
    /** Theme for dark mode; light mode always uses One Light. */
    style: Record<string, CSSProperties>;
    customStyle?: CSSProperties;
    wrapLines?: boolean;
    /** Initial wrapping; the viewer can toggle it. */
    wrapLongLines?: boolean;
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    lineProps?: (lineNumber: number) => Record<string, unknown>;
    children: string;
}) {
    const { resolvedAppearance } = useAppearance();
    const [wrapped, setWrapped] = useState(wrapLongLines);
    const theme = resolvedAppearance === 'light' ? oneLight : style;
    const wrapStyle: CSSProperties = wrapped
        ? {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
          }
        : { whiteSpace: 'pre', wordBreak: 'normal', overflowWrap: 'normal' };

    return (
        <div className="relative min-w-0">
            <button
                type="button"
                onClick={() => setWrapped(!wrapped)}
                title={wrapped ? 'Disable line wrap' : 'Wrap lines'}
                aria-pressed={wrapped}
                className={`absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-md border border-border bg-background/80 backdrop-blur-sm transition-colors hover:text-foreground ${wrapped ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                <WrapText className="size-3.5" />
            </button>
            <SyntaxHighlighter
                language={language}
                style={theme}
                customStyle={{
                    ...customStyle,
                    overflowX: 'auto',
                    ...wrapStyle,
                }}
                // Themes pin `white-space: pre` on <code>, which beats the
                // library's own wrapLongLines style, so set it explicitly.
                codeTagProps={{
                    className: `language-${language}`,
                    style: {
                        ...theme['code[class*="language-"]'],
                        ...theme[`code[class*="language-${language}"]`],
                        ...wrapStyle,
                    },
                }}
                wrapLines={wrapLines}
                wrapLongLines={wrapped}
                showLineNumbers={showLineNumbers}
                startingLineNumber={startingLineNumber}
                lineProps={lineProps}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
}
