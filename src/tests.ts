export type Difficulty = 'easy' | 'medium' | 'hard' | 'boss';

export interface RubricCheck {
  id: string;
  label: string;
  verify?: string;
}

export interface BenchmarkTest {
  id: string;
  file: string;
  title: string;
  difficulty: Difficulty;
  prompt: string;
  rubric: RubricCheck[];
}

const files = import.meta.glob('/tests/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function unquoteYaml(s: string): string {
  s = s.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

interface RawCheck { label: string; verify?: string }
interface Frontmatter {
  difficulty?: Difficulty;
  checks: RawCheck[];
}

// Minimal YAML parser tailored to our schema:
//   difficulty: <scalar>
//   checks:
//     - <scalar>                  # plain string item → label only
//     - label: <scalar>           # object item with optional verify field
//       verify: <scalar>
function parseFrontmatter(text: string): { fm: Frontmatter; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: { checks: [] }, body: text };
  const inner = m[1];
  const body = text.slice(m[0].length);
  const lines = inner.split('\n');
  const fm: Frontmatter = { checks: [] };
  let inChecks = false;
  let current: RawCheck | null = null;

  const flush = () => { if (current) { fm.checks.push(current); current = null; } };

  for (const line of lines) {
    if (inChecks) {
      // " - <something>" — start of a new item
      const dash = line.match(/^(\s+)-\s+(.*)$/);
      if (dash) {
        flush();
        const rest = dash[2];
        // Inline `label: ...` opens an object item
        const inlineKv = rest.match(/^([a-zA-Z_]+)\s*:\s*(.*)$/);
        if (inlineKv) {
          current = { label: '' };
          if (inlineKv[1] === 'label') current.label = unquoteYaml(inlineKv[2]);
          else if (inlineKv[1] === 'verify') current.verify = unquoteYaml(inlineKv[2]);
        } else {
          current = { label: unquoteYaml(rest) };
        }
        continue;
      }
      // "    label: ..." or "    verify: ..." — continuation of current object item
      const cont = line.match(/^\s+([a-zA-Z_]+)\s*:\s*(.*)$/);
      if (cont && current) {
        if (cont[1] === 'label') current.label = unquoteYaml(cont[2]);
        else if (cont[1] === 'verify') current.verify = unquoteYaml(cont[2]);
        continue;
      }
      // anything else ends the checks block
      flush();
      inChecks = false;
    }
    const kv = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    if (key === 'checks' && rawVal.trim() === '') { inChecks = true; continue; }
    if (key === 'difficulty') {
      const v = unquoteYaml(rawVal) as Difficulty;
      if (['easy', 'medium', 'hard', 'boss'].includes(v)) fm.difficulty = v;
    }
  }
  flush();
  return { fm, body };
}

function extractPrompt(body: string): string | null {
  const heading = body.match(/^##\s+Prompt\s*$/m);
  if (!heading) return null;
  const start = (heading.index ?? 0) + heading[0].length;
  const after = body.slice(start);
  const nextH2 = after.match(/^##\s+/m);
  const slice = nextH2 ? after.slice(0, nextH2.index) : after;
  const fenced = slice.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```/);
  return fenced ? fenced[1].trim() : null;
}

function extractTitle(body: string): string | null {
  const m = body.match(/^# (?!#)(.+)$/m);
  return m ? m[1].trim() : null;
}

function loadTests(): BenchmarkTest[] {
  const out: BenchmarkTest[] = [];
  for (const [path, content] of Object.entries(files)) {
    const fileBase = path.split('/').pop()!.replace(/\.md$/, '');
    const { fm, body } = parseFrontmatter(content);
    const title = extractTitle(body);
    const prompt = extractPrompt(body);
    if (!title || !prompt || !fm.difficulty) continue;
    const rubric: RubricCheck[] = fm.checks
      .filter((c) => c.label.trim() !== '')
      .map((c, i) => ({ id: `c${i + 1}`, label: c.label, verify: c.verify }));
    out.push({ id: fileBase, file: fileBase, title, difficulty: fm.difficulty, prompt, rubric });
  }
  const order: Difficulty[] = ['easy', 'medium', 'hard', 'boss'];
  return out.sort((a, b) => {
    const da = order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
    return da !== 0 ? da : a.title.localeCompare(b.title);
  });
}

export const TESTS: BenchmarkTest[] = loadTests();

export function findTest(id: string | undefined): BenchmarkTest | undefined {
  if (!id) return undefined;
  return TESTS.find((t) => t.id === id);
}
