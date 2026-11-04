import { getKana } from './kana';

type Script = 'hiragana' | 'katakana';
type GroupSelection = { single: string[]; composite: string[] };
export type Progress = {
  selected: number[];
  kana: {
    script: Script;
    composite: boolean;
    selected: Record<Script, GroupSelection>;
  };
};

export const initial: Progress = {
  selected: [1],
  kana: {
    script: 'hiragana',
    composite: false,
    selected: {
      hiragana: { single: ['a', 'ka', 'sa'], composite: ['k', 'sh', 'ch'] },
      katakana: { single: ['a', 'ka', 'sa'], composite: ['k', 'sh', 'ch'] },
    },
  },
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readGroups(value: unknown, script: Script, composite: boolean): string[] {
  const mode = composite ? 'composite' : 'single';
  if (!Array.isArray(value)) return [...initial.kana.selected[script][mode]];
  const valid = new Set(getKana(script, composite).map(item => item.group));
  return [...new Set(value.filter((group): group is string => typeof group === 'string' && valid.has(group)))];
}

export function readProgress(value: unknown): Progress {
  const saved = object(value);
  const kana = object(saved.kana);
  const selections = object(kana.selected);
  const hiragana = object(selections.hiragana);
  const katakana = object(selections.katakana);
  return {
    selected: Array.isArray(saved.selected)
      ? [...new Set(saved.selected.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0 && id <= 50))]
      : [...initial.selected],
    kana: {
      script: kana.script === 'katakana' ? 'katakana' : 'hiragana',
      composite: kana.composite === true,
      selected: {
        hiragana: { single: readGroups(hiragana.single, 'hiragana', false), composite: readGroups(hiragana.composite, 'hiragana', true) },
        katakana: { single: readGroups(katakana.single, 'katakana', false), composite: readGroups(katakana.composite, 'katakana', true) },
      },
    },
  };
}
