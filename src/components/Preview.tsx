import { useMemo } from 'react';

export type PreviewSize = 'fit' | 'hd' | 'square';

function detectKind(text: string): 'html' | 'svg' | 'text' {
  const t = text.trim();
  if (/^<svg[\s>]/i.test(t)) return 'svg';
  if (/<!doctype html|<html[\s>]|<body[\s>]|<head[\s>]|<style[\s>]|<script[\s>]/i.test(t)) return 'html';
  if (/^<[a-z][\s\S]*<\/[a-z]/i.test(t)) return 'html';
  return 'text';
}

function extractCodeBlock(text: string): string {
  const fence = text.match(/```(?:html|svg|xml)?\n([\s\S]*?)```/i);
  return fence ? fence[1] : text;
}

interface Props {
  text: string;
  size?: PreviewSize;
}

export function Preview({ text }: Props) {
  const srcdoc = useMemo(() => {
    const cleaned = extractCodeBlock(text);
    const kind = detectKind(cleaned);
    if (kind === 'html') {
      if (/<html[\s>]/i.test(cleaned)) return cleaned;
      return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;color:#fff;background:#0a0a0a;font-family:system-ui,sans-serif}</style></head><body>${cleaned}</body></html>`;
    }
    if (kind === 'svg') {
      return `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#0a0a0a;display:flex;align-items:center;justify-content:center}svg{max-width:100%;max-height:100%}</style></head><body>${cleaned}</body></html>`;
    }
    const escaped = cleaned.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!doctype html><html><head><style>body{margin:0;padding:12px;color:#e5e5e5;background:#0a0a0a;font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap;word-wrap:break-word}</style></head><body>${escaped}</body></html>`;
  }, [text]);

  return (
    <iframe
      title="preview"
      srcDoc={srcdoc}
      sandbox="allow-scripts"
      className="w-full h-full bg-black border-0 block"
    />
  );
}
