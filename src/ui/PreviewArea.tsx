import { useMemo } from 'react';

// View mode controls the preview's aspect ratio.
export type ViewMode = '1:1' | 'HD' | '9:16';

// Overflow multiplier — `off` clips the iframe at its element bounds (default
// browser behavior). The other levels render the iframe at a larger internal
// size and shrink it back via CSS transform, so content the model positioned
// outside its "natural" viewport (boss-animals bouncing past the edge,
// orrery orbits drawn at radius 800 in a 500-wide canvas, fireworks flying
// up the gutter) becomes visible at smaller scale within the same display
// area. Iframes are clipping windows in the browser, so this scale-down
// trick is the only way to reveal escaped content — visible padding alone
// can't, because the iframe element doesn't paint outside its bounds.
export type OverflowLevel = 0 | 1 | 4 | 10;

// CSS aspect-ratio strings — one per view mode.
const ASPECT: Record<ViewMode, string> = {
  '1:1':  '1 / 1',
  HD:     '16 / 9',
  '9:16': '9 / 16',
};

// Linear zoom factor per overflow level. Visible area scales as zoom².
//   off → 1.00 (no zoom-out)
//   1×  → 1.30 (~70% more area, modest buffer)
//   4×  → 2.00 (4× more area)
//   10× → 3.16 (≈10× more area)
const ZOOM: Record<OverflowLevel, number> = {
  0: 1,
  1: 1.3,
  4: 2,
  10: 3.16,
};

interface FrameProps {
  // Either an HTML string to render inside the iframe, or undefined to show a
  // striped placeholder (during streaming or for "no content yet" states).
  html?: string;
  ratio: string;
  overflow: OverflowLevel;
  mini?: boolean;
  label?: string; // shown in the placeholder
  sub?: string;   // sub-label in the placeholder (e.g. "640×360 · laptop")
  // Optional max-width for the iframe column. Used by 9:16 portrait so the
  // iframe doesn't tower past every other panel in the layout.
  maxWidth?: number | string;
}

// Inject a tiny CSS reset into the iframe so body overflow stays visible —
// without this the model's own `body { overflow: hidden }` would re-clip
// content even within the inflated iframe.
const OVERFLOW_RESET = `<style>html,body{overflow:visible !important}</style>`;

// Models occasionally wrap their output in markdown code fences despite the
// "no markdown fences" instruction in every prompt. Strip them here before
// the iframe sees the content. The raw tab still shows the original text so
// the user can see what the model literally produced.
function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:html|svg|xml|css|javascript|js)?\s*\n([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function StreamFrame({ html, ratio, overflow, mini, label, sub, maxWidth }: FrameProps) {
  const zoom = ZOOM[overflow] ?? 1;
  // Center the inflated iframe inside the visible area: shift its top-left
  // negatively by half the extra it gains in width/height, so its center
  // lines up with the container's center before the scale-down.
  const offsetPct = ((zoom - 1) / 2) * 100;
  const srcDoc = useMemo(() => {
    if (!html) return undefined;
    return OVERFLOW_RESET + stripCodeFences(html);
  }, [html]);

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--c-bg)',
        borderRadius: 6,
        border: '1px solid var(--c-border)',
        overflow: 'visible',
        maxWidth,
        marginLeft: maxWidth != null ? 'auto' : undefined,
        marginRight: maxWidth != null ? 'auto' : undefined,
      }}
    >
      {zoom > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--c-text-4)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            zIndex: 1,
          }}
        >
          zoom {overflow}× · viewport {Math.round(zoom * 100)}%
        </div>
      )}
      <div
        style={{
          aspectRatio: ratio,
          width: '100%',
          background: html
            ? 'var(--c-surface-2)'
            : 'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 8px, transparent 8px 16px), var(--c-surface-2)',
          border: '1px solid var(--c-border-2)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {srcDoc ? (
          // Iframe is inflated to `zoom × 100%` and visually shrunk back via
          // transform: scale(1/zoom) around its center. The model's
          // window.innerWidth becomes `zoom × displayed`, so it renders for
          // the larger viewport — content positioned absolutely past the
          // natural edge is now within the iframe's painted area, and the
          // scale-down drops it back into the displayed size.
          <iframe
            title={label ?? 'preview'}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            style={{
              position: 'absolute',
              top: `-${offsetPct}%`,
              left: `-${offsetPct}%`,
              width: `${zoom * 100}%`,
              height: `${zoom * 100}%`,
              transformOrigin: '50% 50%',
              transform: `scale(${1 / zoom})`,
              border: 0,
              background: 'transparent',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 4,
              color: 'var(--c-text-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ fontSize: mini ? 9 : 'var(--fs-sm)', letterSpacing: 0.4 }}>{label}</div>
            {sub && (
              <div style={{ fontSize: mini ? 8 : 'var(--fs-xs)', color: 'var(--c-text-4)' }}>· {sub} ·</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PreviewAreaProps {
  view: ViewMode;
  html?: string;
  testLabel?: string;
  overflow?: OverflowLevel;
  mini?: boolean;
}

export function PreviewArea({ view, html, testLabel = 'preview', overflow = 1, mini = false }: PreviewAreaProps) {
  // Portrait views are otherwise ~1.78× taller than wide. Cap at 50% column
  // width so the iframe stays at a reasonable height; empty space on the
  // sides becomes visual padding around a centered preview.
  const maxWidth = view === '9:16' ? '50%' : undefined;
  return (
    <StreamFrame
      html={html}
      label={testLabel}
      sub={view}
      ratio={ASPECT[view]}
      overflow={overflow}
      mini={mini}
      maxWidth={maxWidth}
    />
  );
}
