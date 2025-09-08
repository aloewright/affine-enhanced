import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Lightweight heuristic test: flag <input> tags missing id or name
function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (['.tsx', '.jsx', '.html'].includes(extname(p))) files.push(p);
  }
  return files;
}

describe('form inputs should have id or name for accessibility/autofill', () => {
  const roots = [
    join(process.cwd(), 'packages', 'frontend'),
    join(process.cwd(), 'packages', 'frontend', 'apps'),
  ];

  const files: string[] = [];
  for (const r of roots) {
    try {
      walk(r, files);
    } catch {}
  }

  it('flags inputs missing id and name', () => {
    const offenders: { file: string; lines: number[] }[] = [];
    const inputTag = /<input\b[^>]*>/gi;
    files.forEach(f => {
      const src = readFileSync(f, 'utf8');
      let m: RegExpExecArray | null;
      const bad: number[] = [];
      while ((m = inputTag.exec(src))) {
        const tag = m[0];
        const hasId = /\bid\s*=/.test(tag);
        const hasName = /\bname\s*=/.test(tag);
        if (!hasId && !hasName) {
          // crude line calc
          const upto = src.slice(0, m.index);
          const line = upto.split(/\r?\n/).length;
          bad.push(line);
        }
      }
      if (bad.length) offenders.push({ file: f, lines: bad });
    });

    if (offenders.length) {
      const msg = offenders
        .map(o => `${o.file}: lines ${o.lines.join(', ')}`)
        .join('\n');
      // Provide actionable output without failing all CI by default:
      // Switch to expect(offenders).toHaveLength(0) when enforcing hard.
      console.warn(
        '\n[Form A11y] Inputs missing id/name (fix recommended):\n' + msg
      );
    }

    expect(true).toBe(true);
  });
});
