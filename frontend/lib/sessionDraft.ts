// 새로고침해도 입력 중이던 값/결과 화면이 날아가지 않게 하는 sessionStorage 헬퍼.
// (요구사항 3-1: /input에서 폼 작성 중이거나 결과 화면 보는 도중 새로고침해도 복원되게)
export function readSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSession(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 프라이빗 모드 등에서 sessionStorage가 막혀 있어도 앱이 죽으면 안 되니 조용히 무시
  }
}

export function clearSession(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
