"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * 화면 폭이 768px 미만(모바일)인지. 서버 렌더링·첫 화면에서는 false(데스크톱)로 시작한다.
 * 단순히 보이고 숨기는 일은 CSS(`md:` 접두사)로 하고, 모달 종류처럼 다른 컴포넌트를 골라야 할 때만 쓴다.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
