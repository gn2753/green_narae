"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@/data/hooks";
import { signOut } from "@/data/auth";

/** 미답변(상태 "open") 문의 수 — 사이드바·하단 탭 배지 */
export function useOpenInquiryCount(): number {
  const { items } = useCollection("inquiries");
  return items.filter(i => i.status === "open").length;
}

/** 로그아웃 후 로그인 화면으로 */
export function useLogout(): () => void {
  const router = useRouter();
  return useCallback(() => { signOut(); router.replace("/admin/login"); }, [router]);
}
