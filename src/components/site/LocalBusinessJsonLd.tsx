import { SITE_INFO } from "./siteInfo";

/** 지역 업체 구조화 데이터. 주소·전화는 임시 값이며 실제 값 확정 후 교체한다. */
export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_INFO.name,
    description: "간판 디자인·제작·시공 전문 업체",
    address: { "@type": "PostalAddress", streetAddress: SITE_INFO.address, addressCountry: "KR" },
    telephone: SITE_INFO.phone,
    url: SITE_INFO.url,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
