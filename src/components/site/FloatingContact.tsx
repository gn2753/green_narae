"use client";
import Link from "next/link";
import { toast } from "sonner";
import { SITE_INFO } from "./siteInfo";

const kakao = () => toast("카카오톡 채널은 2차에 연결됩니다");

export function FloatingContact() {
  return (
    <>
      <button
        type="button"
        onClick={kakao}
        className="fixed bottom-6 right-6 z-30 hidden min-h-11 items-center gap-1.5 rounded-full border-2 border-ink bg-[#FEE500] px-4 text-[13px] font-black text-[#3A1D1D] md:inline-flex"
        style={{ boxShadow: "3px 3px 0 #24332A" }}
      >
        💬 카톡 상담
      </button>
      <div className="fixed inset-x-0 bottom-0 z-30 box-border flex h-[var(--mobile-bar-h)] gap-2 border-t-2 border-ink bg-white p-2.5 md:hidden">
        <button
          type="button"
          onClick={() => toast(`데모에서는 전화가 연결되지 않아요 · ${SITE_INFO.phone}`)}
          className="min-h-11 flex-1 rounded-[10px] border-2 border-ink text-[13px] font-bold"
        >
          📞 전화
        </button>
        <button type="button" onClick={kakao} className="min-h-11 flex-1 rounded-[10px] border-2 border-ink bg-[#FEE500] text-[13px] font-bold text-[#3A1D1D]">
          💬 카톡
        </button>
        <Link href="/contact" className="flex min-h-11 flex-1 items-center justify-center rounded-[10px] border-2 border-ink bg-brand text-[13px] font-bold text-white">
          문의하기
        </Link>
      </div>
    </>
  );
}
