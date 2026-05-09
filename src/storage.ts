import type { MetricUnit, Mode, ModelConfig } from './types';
import { defaultBaseUrl } from './providers';

// Configs (small, sync-only) live in localStorage. Round/session history lives
// in IndexedDB — see src/db.ts. Mode selection (compare | bench) also persists
// in localStorage so the chosen view survives refreshes.

const CONFIG_KEY = 'llm-compare-v1';
const MODE_KEY = 'compare-llms.mode';
const UNIT_KEY = 'compare-llms.unit';

export interface PersistedConfigs {
  configA: ModelConfig;
  configB: ModelConfig;
  // Single-model card used by Bench mode. Defaults to configA if absent.
  configBench?: ModelConfig;
}

function makeDefaultConfig(id: string, label: string, baseUrl?: string, extra?: string): ModelConfig {
  return {
    id,
    label,
    provider: 'openai',
    baseUrl: baseUrl ?? defaultBaseUrl('openai'),
    model: '',
    apiKey: '',
    extra: extra ?? '',
  };
}

export function loadConfigs(): PersistedConfigs {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedConfigs;
      if (parsed.configA && parsed.configB) return parsed;
    }
  } catch { /* noop */ }
  return {
    configA: makeDefaultConfig('A', 'Model A', 'http://192.168.1.67:8000/v1', 'dflash'),
    configB: makeDefaultConfig('B', 'Model B', 'http://192.168.1.66:8000/v1', 'mtp'),
  };
}

export function saveConfigs(configs: PersistedConfigs): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(configs)); } catch { /* noop */ }
}

export function loadMode(): Mode {
  const v = localStorage.getItem(MODE_KEY);
  return v === 'bench' ? 'bench' : 'compare';
}

export function saveMode(mode: Mode): void {
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* noop */ }
}

export function loadUnit(): MetricUnit {
  const v = localStorage.getItem(UNIT_KEY);
  return v === 'tokens' ? 'tokens' : 'chars';
}

export function saveUnit(unit: MetricUnit): void {
  try { localStorage.setItem(UNIT_KEY, unit); } catch { /* noop */ }
}
