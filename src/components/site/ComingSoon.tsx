import Link from "next/link";
import { Hammer } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="ink-card flex w-full flex-col items-center gap-4 px-6 py-10">
        <Hammer className="size-10 text-brand" aria-hidden />
        <h1 className="font-jua text-3xl text-ink">{title}</h1>
        <p className="text-sm leading-relaxed text-[#56645C]">{description}</p>
        <Link href="/contact" className="ink-btn inline-flex h-11 items-center bg-brand px-6 text-white">문의하기</Link>
      </div>
    </section>
  );
}
