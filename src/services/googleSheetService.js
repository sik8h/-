const GAS_URL = "https://script.google.com/macros/s/AKfycbz1GvHqsae_JspPAJpAGqX5Fs9hbhqrvW9QvnNvGzLBPdil3ckutmR_Xk0SUSeR4kKa_g/exec";

// 품목/위치/카테고리 텍스트 기반 4대 메인 폴더 자동 결정 함수
export function resolveCategory(rawCategory, item, location) {
  const combined = `${rawCategory || ''} ${item || ''} ${location || ''}`.toLowerCase();

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
export async function fetchMasterDataFromSheet() {
  try {
    // 캐시 방지를 위해 timestamp 파라미터 추가
    const res = await fetch(`${GAS_URL}?t=${Date.now()}`, { method: "GET" });
    if (!res.ok) throw new Error("네트워크 응답 오류");
    const json = await res.json();

    if (json.status === "success") {
      const stores = (json.stores || []).map((s) => ({
        code: s.code || s.name,
        name: s.name,
        phone: s.phone || "",
        location: s.location || "",
        defaultItem: s.defaultItem || "",
        carrierSpec: s.carrierSpec || "",
        category: resolveCategory(s.category, s.defaultItem, s.location)
      }));

      const customers = (json.customers || []).map((c) => ({
        name: c.name,
        phone: c.phone || "",
        address: c.address || "",
        usedStores: Array.isArray(c.usedStores) ? c.usedStores : [],
        lastUpdated: c.lastUpdated || ""
      }));

      // 로컬스토리지 백업 저장
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
export function logOrderToSheetAsync(order, customer) {
  try {
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ order, customer })
    }).catch(e => console.warn("시트 저장 오류:", e));
  } catch (err) {
    console.warn("시트 호출 예외:", err);
  }
}
