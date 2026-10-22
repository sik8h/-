const GAS_URL = "https://script.google.com/macros/s/AKfycbxSYVAFQw1x_YyfQ6nkk16v5s83wacdVOTiMHJSsU5S6Z4qvLNrcxHAY0aqZsQWaLU64A/exec";

export interface MasterStore {
  code: string;
  name: string;
  phone: string;
  location: string;
  defaultItem: string;
  carrierSpec: string;
  category: string; // 폴더 분류명
}

export interface MasterCustomer {
  name: string;
  phone: string;
  address: string;
  usedStores: string[];
  lastUpdated?: string;
}

// 품목/위치/카테고리 텍스트 기반 4대 메인 폴더 자동 결정 함수
export function resolveCategory(rawCategory: string, item: string, location: string): string {
  const combined = `${rawCategory} ${item} ${location}`.toLowerCase();

  if (combined.match(/청과|과일|사과|배|감|귤|딸기|고구마|감자|백운|억기|천왕|16번|52번|매점/)) {
    return "가락몰 - 청과/고구마";
  }
  if (combined.match(/건어물|김|미역|멸치|굴비|황태|오징어|수도|대산|영화|성진|성광|상아|미나/)) {
    return "가락몰 - 건어물";
  }
  if (combined.match(/야채|채소|양념|고추|마늘|당근|부추|쌈|대일|율리|인화|창성|호남/)) {
    return "가락몰 - 야채/양념";
  }
  if (combined.match(/수산|활어|축산|정육|한우|김치|생강|일호|유일|자매|또순|신창|삼진/)) {
    return "가락몰 - 수산/축산/기타";
  }
  return "기타";
}

// 구글 시트 마스터 데이터 조회 (강제 갱신 파라미터 지원)
export async function fetchMasterDataFromSheet(): Promise<{ stores: MasterStore[]; customers: MasterCustomer[] } | null> {
  try {
    const res = await fetch(`${GAS_URL}?t=${Date.now()}`, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("네트워크 응답 오류");
    const json = await res.json();

    if (json.status === "success") {
      const stores: MasterStore[] = (json.stores || []).map((s: any) => {
        if (Array.isArray(s)) {
          return {
            code: String(s[0] || ""),
            name: String(s[1] || s[0] || ""),
            phone: String(s[2] || ""),
            location: String(s[3] || ""),
            defaultItem: String(s[4] || ""),
            carrierSpec: String(s[5] || ""),
            category: resolveCategory(String(s[6] || ""), String(s[4] || ""), String(s[3] || ""))
          };
        }
        return {
          code: String(s.code || s.name || ""),
          name: String(s.name || s.code || ""),
          phone: String(s.phone || ""),
          location: String(s.location || ""),
          defaultItem: String(s.defaultItem || s.item || ""),
          carrierSpec: String(s.carrierSpec || s.spec || ""),
          category: resolveCategory(String(s.category || ""), String(s.defaultItem || s.item || ""), String(s.location || ""))
        };
      });

      const customers: MasterCustomer[] = (json.customers || []).map((c: any) => {
        if (Array.isArray(c)) {
          return {
            name: String(c[0] || ""),
            phone: String(c[1] || ""),
            address: String(c[2] || ""),
            usedStores: c[3] ? String(c[3]).split(",").map(st => st.trim()) : [],
            lastUpdated: String(c[4] || "")
          };
        }
        return {
          name: String(c.name || ""),
          phone: String(c.phone || ""),
          address: String(c.address || ""),
          usedStores: Array.isArray(c.usedStores) ? c.usedStores : (c.usedStores ? String(c.usedStores).split(",").map(st => st.trim()) : []),
          lastUpdated: String(c.lastUpdated || "")
        };
      });

      localStorage.setItem("cached_stores", JSON.stringify(stores));
      localStorage.setItem("cached_customers", JSON.stringify(customers));
      localStorage.setItem("cached_last_sync", new Date().toLocaleTimeString("ko-KR"));

      return { stores, customers };
    }
  } catch (err) {
    console.warn("구글 시트 연동 실패 (로컬 캐시 사용):", err);
  }
  return null;
}

// 출고 로그 누적 및 단골 자동 최신본 저장 (비동기 논블로킹)
export function logOrderToSheetAsync(order: any, customer?: any): void {
  try {
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "logOrder", order, customer })
    }).catch(e => console.warn("시트 저장 오류:", e));
  } catch (err) {
    console.warn("시트 호출 예외:", err);
  }
}

// 업체 정보 구글 시트 거래처 탭 실시간 자동 저장/수정
export function saveStoreToSheetAsync(store: any): void {
  try {
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "saveStore", store })
    }).catch(e => console.warn("업체 시트 저장 오류:", e));
  } catch (err) {
    console.warn("업체 시트 호출 예외:", err);
  }
}

// 구글 시트 출고내역 목록 조회
export async function fetchOrderLogsFromSheet(): Promise<any[] | null> {
  try {
    const res = await fetch(`${GAS_URL}?action=get_logs&t=${Date.now()}`, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("네트워크 응답 오류");
    const json = await res.json();
    if (json.status === "success" && Array.isArray(json.logs)) {
      localStorage.setItem("cached_logs", JSON.stringify(json.logs));
      return json.logs;
    }
  } catch (err) {
    console.warn("출고내역 조회 실패:", err);
  }
  return null;
}

export const fetchLogsFromSheet = fetchOrderLogsFromSheet;

// 구글 시트 출고내역 해당 행 취소 기록
export function cancelOrderToSheetAsync(rowId: string | number): void {
  try {
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "cancelOrder", cancelRow: rowId })
    }).catch(e => console.warn("출고 취소 시트 오류:", e));
  } catch (err) {
    console.warn("출고 취소 예외:", err);
  }
}

// 웹앱 전체 데이터 구글 시트로 일괄 업로드 저장
export async function syncAllToSheetAsync(stores: any[], customers: any[]): Promise<boolean> {
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "sync_all_to_sheet",
        stores,
        customers
      })
    });
    return true;
  } catch (err) {
    console.warn("전체 시트 저장 오류:", err);
    return false;
  }
}
