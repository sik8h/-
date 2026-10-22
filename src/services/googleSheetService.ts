const GAS_URL = "https://script.google.com/macros/s/AKfycbz1GvHqsae_JspPAJpAGqX5Fs9hbhqrvW9QvnNvGzLBPdil3ckutmR_Xk0SUSeR4kKa_g/exec";

export interface SheetCustomer {
  name: string;
  phone: string;
  address: string;
  usedStores: string[];
  lastUpdated?: string;
}

export interface SheetOrder {
  store: string;
  carrier: string;
  boxType: string;
  fee: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddr: string;
  item: string;
  quantity: number;
}

// 1. 앱 시작 시 구글 시트에서 최신 단골 목록 비동기 동기화
export async function syncCustomersFromSheet(): Promise<SheetCustomer[] | null> {
  try {
    const res = await fetch(GAS_URL, { method: "GET" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "success" && Array.isArray(data.customers)) {
      return data.customers;
    }
  } catch (err) {
    console.warn("구글 시트 단골 동기화 지연 (로컬 캐시 사용):", err);
  }
  return null;
}

// 2. [양식 복사] 시 백그라운드로 구글 시트에 출고로그 누적 & 단골 최신 덮어쓰기 (무차단 비동기)
export function logOrderToSheetAsync(
  order: SheetOrder,
  customer?: { name: string; phone: string; address: string; store: string }
): void {
  try {
    const payload = {
      order,
      customer: customer && customer.name ? customer : undefined
    };
    // CORS Preflight를 피하기 위해 text/plain 사용 및 no-cors 백그라운드 전송
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(e => console.warn("시트 백그라운드 전송 오류:", e));
  } catch (err) {
    console.warn("시트 로깅 예외:", err);
  }
}
