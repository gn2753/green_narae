export function SectionTitle({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mb-5">
      <div className="font-jua text-sm text-coral">{eyebrow}</div>
      <h2 className="font-jua text-2xl text-ink md:text-3xl">{title}</h2>
      {lead && <p className="mt-1 text-sm text-[#56645C]">{lead}</p>}
    </div>
  );
}
