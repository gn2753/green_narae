import { SITE_INFO } from "../siteInfo";
import { InquiryForm } from "../contact/InquiryForm";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-16 border-t-2 border-ink bg-brand text-white">
      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:gap-8 md:px-8 md:py-12">
        <div>
          <div className="font-jua text-sm text-sun">CONTACT</div>
          <h2 className="mb-2 font-jua text-2xl md:text-3xl">간판 고민, 편하게 물어보세요</h2>
          <p className="mb-5 text-sm leading-relaxed opacity-90">
            회원가입 없이 바로 문의하실 수 있어요.<br />
            회원으로 남기시면 나중에 진행 상황을 마이페이지에서 확인할 수 있습니다. <span className="opacity-70">(2차 예정)</span>
          </p>
          <ul className="space-y-1 text-[13px] leading-loose">
            <li>📞 {SITE_INFO.phone}</li>
            <li>✉️ {SITE_INFO.email}</li>
            <li>📍 {SITE_INFO.address}</li>
            <li>🕘 {SITE_INFO.hours}</li>
          </ul>
        </div>
        <InquiryForm compact />
      </div>
    </section>
  );
}
