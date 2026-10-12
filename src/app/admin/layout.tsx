"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAdmin } from "@/data/hooks";
import { normalizePath } from "@/domain/adminNav";
import { AdminShell } from "@/components/admin/shell/AdminShell";

/**
 * 관리자 영역 레이아웃(클라이언트): 로그인 화면은 셸 없이, 나머지는 로그인 확인 후 셸 안에 그린다.
 * 로그인하지 않았으면 `/admin/login?next=<현재 경로+쿼리>`로 보낸다(로그아웃 직후에는 next 없이).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, ready } = useAdmin();
  const isLogin = normalizePath(pathname) === "/admin/login";
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (admin) { wasSignedIn.current = true; return; }
    if (!ready || isLogin) return;
    const target = wasSignedIn.current ? "/admin/login" : `/admin/login?next=${encodeURIComponent(normalizePath(pathname) + window.location.search)}`;
    wasSignedIn.current = false;
    router.replace(target);
  }, [admin, ready, isLogin, pathname, router]);

  if (isLogin) return <>{children}</>;
  if (!admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-admin-bg text-[#56645C]" aria-busy="true">
        <LoaderCircle className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">로그인 확인 중</span>
      </div>
    );
  }
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
