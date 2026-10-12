"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import type { AdminId } from "@/domain/types";
import { ADMINS } from "@/domain/defaults";
import { safeNextPath } from "@/domain/adminNav";
import { signIn } from "@/data/auth";
import { DemoBanner } from "@/components/common/DemoBanner";
import { AdminAvatar } from "@/components/common/AdminAvatar";

function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState<AdminId | null>(null);

  const enter = (id: AdminId) => {
    setPending(id);
    signIn(id);
    router.replace(safeNextPath(params.get("next")));
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#E3E8E4] bg-white p-6 shadow-[0_8px_30px_rgba(31,42,36,0.08)] sm:p-8">
      <p className="font-jua text-lg text-brand"><span aria-hidden>🍃</span> 그린나래 업무</p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-[#1F2A24]">그린나래 관리자</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5F6B64]">허용된 두 대표만 접속할 수 있어요. (데모: 비밀번호 없이 선택)</p>
      <div className="mt-6 flex flex-col gap-2.5">
        {(["kim", "choi"] as const).map(id => {
          const a = ADMINS[id];
          return (
            <button
              key={id}
              type="button"
              disabled={pending !== null}
              onClick={() => enter(id)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-[#DDE3DF] bg-white px-4 text-left font-bold text-[#1F2A24] transition-colors outline-none hover:border-brand hover:bg-[#F3FAF6] focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
            >
              <AdminAvatar id={id} size="md" />
              <span className="flex-1">{a.name}({a.title})으로 보기</span>
              {pending === id && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-[#7A867F]">실제 서비스에서는 Google 계정 로그인 + 허용 목록 확인으로 바뀝니다.</p>
      <Link href="/" className="-ml-2 mt-4 inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-[#56645C] hover:text-[#1F2A24]">
        <ChevronLeft className="size-4" aria-hidden /> 홈으로
      </Link>
    </div>
  );
}

/** 목업 로그인: 두 대표 중 한 명을 골라 들어간다(`?next=`의 관리자 경로로 복귀). */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-admin-bg">
      <DemoBanner variant="admin" />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Suspense fallback={<LoaderCircle className="size-6 animate-spin text-[#56645C]" aria-label="불러오는 중" />}>
          <LoginCard />
        </Suspense>
      </main>
    </div>
  );
}
