import { load } from "@tauri-apps/plugin-store";

export type PersistedState = {
  projectDraft: {
    subject: string;
    theme: string;
    avgLength: number;
    format: string;
    example: string;
  } | null;
  csvMapping: Record<string, string> | null;
  resultsByStudentId: Record<string, string>;
  currentIdx: number;
};

const DEFAULT_STATE: PersistedState = {
  projectDraft: null,
  csvMapping: null,
  resultsByStudentId: {},
  currentIdx: 0,
};

const STORE_PATH = "seeteuk-store.json";

// store는 싱글톤으로 재사용
let _store: Awaited<ReturnType<typeof load>> | null = null;

export async function getStore() {
  if (_store) return _store;
  _store = await load(STORE_PATH, {
    autoSave: 300,
    defaults: {},
  }); // 300ms 디바운스 자동저장
  return _store;
}

export async function loadState(): Promise<PersistedState> {
  const store = await getStore();
  const state = await store.get<PersistedState>("state");
  return state ?? DEFAULT_STATE;
}

export async function saveState(next: PersistedState) {
  const store = await getStore();
  await store.set("state", next);
  // autoSave라면 save() 호출 안 해도 되지만,
  // 크래시 대비 강제 저장하고 싶으면 아래도 가능:
  // await store.save();
}
