import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-1.5 font-jua text-[22px] text-brand" aria-label="그린나래 홈">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 19C5 10 10 4 20 4c0 9-5 15-13 15" fill="#BDE8C9" stroke="#24332A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M5 19c3-5 6-8 10-10" stroke="#24332A" strokeWidth="2" strokeLinecap="round" />
      </svg>
      그린나래
    </Link>
  );
}
