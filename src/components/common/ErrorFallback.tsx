"use client";

/** 오류 화면 공통 내용. 제공자(Provider)에 기대지 않고 순수 HTML·인라인 스타일만 쓴다. */
export function ErrorFallback({ reset }: { reset: () => void }) {
  const resetDemo = () => {
    try { localStorage.removeItem("gn-demo-v1"); } catch { /* 저장소를 못 쓰면 그냥 새로고침 */ }
    location.reload();
  };
  const btn = { minHeight: 44, padding: "0 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" } as const;
  return (
    <div role="alert" style={{ minHeight: "60dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#1F2A24" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>화면을 불러오는 중 문제가 생겼어요</h1>
      <p style={{ margin: 0, fontSize: 14, color: "#56645C", lineHeight: 1.6 }}>잠시 후 다시 시도해 주세요. 계속되면 데모 데이터를 초기화해 보세요.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={reset} style={{ ...btn, background: "#2F8F57", color: "#fff", border: "none" }}>다시 시도</button>
        <button type="button" onClick={resetDemo} style={{ ...btn, background: "#fff", color: "#1F2A24", border: "1px solid #D5DDD8" }}>데모 데이터 초기화</button>
      </div>
    </div>
  );
}
