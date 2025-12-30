import { load } from "@tauri-apps/plugin-store";

export type PersistedState = {
  version: 1;
  savedAt: number;

  fileName: string;
  cols: string[];

  project: {
    subject: string;
    theme: string;
    avgLength: number;
    format: string;
    example: string;
  };

  mapping: {
    displayKey: string;
    activityKeys: string[];
  };

  idx: number;
  extraByIdx: Record<number, string>;
  resultByIdx: Record<number, string>;
};

const STORE_PATH = "seeteuk-store.json";
const STATE_KEY = "state";

let _store: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (_store) return _store;
  // autoSave: set()가 호출되면 일정 시간 뒤 자동 save()
  _store = await load(STORE_PATH, { autoSave: 400, defaults: {} });
  return _store;
}

export async function loadPersistedState(): Promise<PersistedState | null> {
  const store = await getStore();
  return (await store.get<PersistedState>(STATE_KEY)) ?? null;
}

export async function savePersistedState(state: PersistedState) {
  const store = await getStore();
  await store.set(STATE_KEY, state);
  // autoSave라 save()는 선택이지만, 안전하게 즉시 저장하고 싶으면:
  // await store.save();
}

export async function clearPersistedState() {
  const store = await getStore();
  await store.delete(STATE_KEY);
  await store.save();
}
