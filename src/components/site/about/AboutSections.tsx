import Link from "next/link";
import { Truck, Printer, Scissors } from "lucide-react";
import { asset } from "@/lib/asset";
import { SectionTitle } from "../SectionTitle";

const PEOPLE = [
  { initial: "김", color: "#2F8F57", role: "대표이사", name: "김자연", duty: "디자인 · 견적 · 고객 소통", text: "첫 상담부터 시안, 견적까지 사장님 곁에서 차근차근 안내해 드립니다." },
  { initial: "최", color: "#3D5A80", role: "대표", name: "최관웅", duty: "실측 · 시공 · 납품", text: "현장 실측부터 제작물 설치와 납품까지 직접 책임지고 마무리합니다." },
];

export function AboutIntro() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <SectionTitle eyebrow="ABOUT" title="안녕하세요, 그린나래디자인입니다" />
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8">
        <div className="space-y-3 text-sm leading-loose md:text-[15px]">
          <p>가게의 첫인상은 간판에서 시작됩니다. 그린나래디자인은 디자인과 제작, 시공을 한 팀이 직접 맡아 처음 상담부터 마지막 설치까지 사장님과 같은 사람이 이야기를 나눕니다.</p>
          <p>중간 단계를 줄여 견적은 투명하게, 일정은 빠르게 드립니다. 작은 가게의 간판 하나도 내 가게 일처럼 꼼꼼하게 만들겠습니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          {PEOPLE.map((p) => (
            <div key={p.name} className="ink-card flex items-start gap-3 p-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-ink font-jua text-2xl text-white" style={{ background: p.color }} aria-hidden>{p.initial}</div>
              <div>
                <div className="text-xs text-[#56645C]">{p.role}</div>
                <b className="font-jua text-lg font-normal">{p.name}</b>
                <div className="text-xs font-bold text-brand">{p.duty}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#56645C]">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const AXES = [
  { img: "/samples/about-design.svg", title: "간판 디자인", text: "가게 업종과 분위기에 맞춰 시안을 2~3안 제안드려요. 사장님 의견을 반영해 수정합니다." },
  { img: "/samples/about-make.svg", title: "제작", text: "채널 가공, 실사 출력, 레이저 커팅까지 자체 장비로 만들어 품질과 납기를 맞춥니다." },
  { img: "/samples/about-install.svg", title: "시공", text: "실측한 사람이 설치까지 합니다. 고소작업차로 높은 곳도 안전하게 시공해요." },
];

export function ServiceAxes() {
  return (
    <section className="border-y-2 border-ink bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
        <SectionTitle eyebrow="SERVICE" title="디자인부터 시공까지 한 번에" />
        <div className="grid gap-4 md:grid-cols-3">
          {AXES.map((a) => (
            <div key={a.title} className="ink-card overflow-hidden">
              <div className="aspect-[16/10] border-b-2 border-ink bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(a.img)} alt="" loading="lazy" className="size-full object-cover" />
              </div>
              <div className="p-4">
                <b className="font-jua text-xl font-normal">{a.title}</b>
                <p className="mt-1 text-[13px] leading-relaxed text-[#56645C]">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SIGN_TYPES = [
  { name: "채널간판", text: "글자를 입체로 만들어 LED로 밝히는 가장 대중적인 간판이에요." },
  { name: "돌출간판", text: "길 가던 손님 눈에 먼저 띄는, 건물 벽면에서 튀어나온 간판입니다." },
  { name: "실내사인", text: "매장 안 로고월, 안내 사인, 메뉴판 등 실내 분위기를 완성해요." },
  { name: "어닝·실사", text: "어닝 천막과 실사 출력 간판으로 저렴하고 빠르게 교체할 수 있어요." },
  { name: "LED·네온", text: "LED 네온사인으로 밤에 더 돋보이는 개성 있는 간판을 만듭니다." },
];

export function SignTypeList() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <SectionTitle eyebrow="SIGN TYPES" title="어떤 간판을 만들어요?" lead="종류별 시공 사례를 바로 확인해 보세요." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIGN_TYPES.map((t) => (
          <li key={t.name} className="ink-card flex flex-col p-4">
            <b className="font-jua text-lg font-normal">{t.name}</b>
            <p className="mb-3 mt-1 flex-1 text-[13px] leading-relaxed text-[#56645C]">{t.text}</p>
            <Link href={`/portfolio?type=${encodeURIComponent(t.name)}`} className="flex min-h-11 items-center text-sm font-bold text-brand">사례 보기 →</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const EQUIPMENT = [
  { Icon: Truck, name: "고소작업차", text: "3층 이상 높은 곳 간판도 외부 장비 없이 직접 시공합니다." },
  { Icon: Printer, name: "실사출력기", text: "선명한 대형 출력물을 빠르게 뽑아 납기를 줄여요." },
  { Icon: Scissors, name: "CNC 레이저", text: "아크릴·금속을 정밀하게 가공해 입체 글자와 로고를 만듭니다." },
];

export function Equipment() {
  return (
    <section className="border-y-2 border-ink bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
        <SectionTitle eyebrow="EQUIPMENT" title="보유 장비" lead="직접 만들고 직접 설치하는 이유예요." />
        <div className="grid gap-3 md:grid-cols-3">
          {EQUIPMENT.map(({ Icon, name, text }) => (
            <div key={name} className="ink-card flex gap-3 p-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sun"><Icon className="size-6" aria-hidden /></div>
              <div>
                <b className="font-jua text-lg font-normal">{name}</b>
                <p className="text-[13px] leading-relaxed text-[#56645C]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutCta() {
  return (
    <section className="border-b-2 border-ink bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center md:px-8 md:py-12">
        <h2 className="font-jua text-2xl md:text-3xl">우리 가게 간판, 같이 고민해 볼까요?</h2>
        <p className="text-sm opacity-90">상담과 실측은 무료예요. 편하게 문의 남겨주세요.</p>
        <Link href="/contact" className="ink-btn flex min-h-11 items-center bg-sun px-6 text-ink">견적·문의하기</Link>
      </div>
    </section>
  );
}
