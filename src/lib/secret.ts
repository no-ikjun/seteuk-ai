import { appDataDir } from "@tauri-apps/api/path";
import { Client, Stronghold } from "@tauri-apps/plugin-stronghold";

const CLIENT_NAME = "seeteuk";
const KEY_NAME = "openai_api_key";

// ✅ 간단/실용 버전:
// - 개인 도구라 "앱 내부 고정 비밀번호"로 vault를 엶
// - 보안을 더 올리려면 "교사 마스터 비밀번호 입력" 흐름으로 확장 가능
const VAULT_PASSWORD = "seeteuk-local-vault-password";

async function initStronghold() {
  try {
    console.log("initStronghold: 시작");
    const appDir = await appDataDir();
    console.log("initStronghold: appDataDir:", appDir);
    const vaultPath = `${appDir}/vault.hold`;
    console.log("initStronghold: vaultPath:", vaultPath);

    const stronghold = await Stronghold.load(vaultPath, VAULT_PASSWORD);
    console.log("initStronghold: Stronghold.load 완료");

    let client: Client;
    try {
      console.log("initStronghold: 기존 클라이언트 로드 시도");
      client = await stronghold.loadClient(CLIENT_NAME);
      console.log("initStronghold: 기존 클라이언트 로드 성공");
    } catch {
      console.log("initStronghold: 새 클라이언트 생성");
      client = await stronghold.createClient(CLIENT_NAME);
      console.log("initStronghold: 새 클라이언트 생성 완료");
    }

    console.log("initStronghold: 완료");
    return { stronghold, client };
  } catch (e) {
    console.error("initStronghold 에러:", e);
    throw new Error(
      `Stronghold 초기화 실패: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export async function saveApiKey(apiKey: string) {
  try {
    console.log("saveApiKey: 시작, 키 길이:", apiKey.length);
    const { stronghold, client } = await initStronghold();
    console.log("saveApiKey: initStronghold 완료");
    const store = client.getStore();
    console.log("saveApiKey: store 가져오기 완료");
    const data = Array.from(new TextEncoder().encode(apiKey.trim()));
    console.log("saveApiKey: 데이터 인코딩 완료, 길이:", data.length);
    await store.insert(KEY_NAME, data);
    console.log("saveApiKey: store.insert 완료");
    await stronghold.save();
    console.log("saveApiKey: stronghold.save 완료");
    console.log("saveApiKey: 저장 완료");
  } catch (e) {
    console.error("saveApiKey 에러:", e);
    throw new Error(
      `API Key 저장 실패: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export async function loadApiKey(): Promise<string | null> {
  try {
    const { client } = await initStronghold();
    const store = client.getStore();

    try {
      const data = await store.get(KEY_NAME);
      if (!data) return null;
      return new TextDecoder().decode(new Uint8Array(data));
    } catch {
      return null;
    }
  } catch (e) {
    console.error("loadApiKey 에러:", e);
    return null;
  }
}

export async function deleteApiKey() {
  try {
    const { stronghold, client } = await initStronghold();
    const store = client.getStore();
    await store.remove(KEY_NAME);
    await stronghold.save();
    console.log("deleteApiKey: 삭제 완료");
  } catch (e) {
    console.error("deleteApiKey 에러:", e);
    throw new Error(
      `API Key 삭제 실패: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
