import type { AppState, ModelConfig } from './types';
import { defaultBaseUrl } from './providers';

const KEY = 'llm-compare-v1';

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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.configA && parsed.configB) return parsed;
    }
  } catch { /* noop */ }
  return {
    configA: makeDefaultConfig('A', 'Model A', 'http://192.168.1.67:8000/v1', 'dflash'),
    configB: makeDefaultConfig('B', 'Model B', 'http://192.168.1.66:8000/v1', 'mtp'),
    rounds: [],
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* noop */ }
}
