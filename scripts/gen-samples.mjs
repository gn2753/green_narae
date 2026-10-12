// 샘플 이미지 생성기: 실제 고객 사진이 아닌 일러스트 썸네일을 만든다.
import { mkdirSync, writeFileSync } from "node:fs";
const out = new URL("../public/samples/", import.meta.url); mkdirSync(out, { recursive: true });
const PF = [
  ["Café 온담", "채널간판", "#2F8F57", "#E7F4EC"], ["해봄 수학", "돌출간판", "#B5651D", "#FFF1D6"], ["밝은내과", "실내사인", "#3D5A80", "#E3F0F7"],
  ["할매국수", "어닝·실사", "#E07A5F", "#FBE3DC"], ["BAR 1984", "LED·네온", "#6CFFB0", "#1B2433"], ["꽃길플라워", "채널간판", "#7B5CC4", "#F3ECFF"],
  ["숲속 키즈", "실내사인", "#1F8A70", "#EAF6F6"], ["24 편의점", "돌출간판", "#C98A00", "#FFF6CC"], ["초록 정육", "어닝·실사", "#2F8F57", "#E7F4EC"],
  ["불맛치킨", "채널간판", "#E63946", "#FDEBEB"], ["온기 베이커리", "채널간판", "#8B5E3C", "#FFF4E6"], ["모아 안경", "LED·네온", "#5CF2FF", "#14202E"],
];
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function sign(type, name, color, variant) {
  const night = variant === 2 || type === "LED·네온";
  const wall = night ? "#1B2433" : "#FFFDF7", ink = "#24332A";
  const font = `font-family="Jua, 'Noto Sans KR', sans-serif"`;
  const glass = night ? "#FFCF7A" : "#CFE8F3";
  const zoom = variant === 3 ? ` transform="translate(-200 -60) scale(1.5)"` : "";
  const board = {
    "채널간판": `<text x="400" y="190" text-anchor="middle" ${font} font-size="86" fill="${color}" stroke="${ink}" stroke-width="3">${esc(name)}</text>`,
    "돌출간판": `<rect x="560" y="90" width="110" height="260" rx="12" fill="#fff" stroke="${ink}" stroke-width="5"/><text x="615" y="120" ${font} font-size="44" fill="${color}" writing-mode="tb" text-anchor="start">${esc(name)}</text><rect x="130" y="130" width="380" height="90" rx="10" fill="${color}" stroke="${ink}" stroke-width="5"/><text x="320" y="192" text-anchor="middle" ${font} font-size="54" fill="#fff">${esc(name)}</text>`,
    "실내사인": `<rect x="150" y="90" width="500" height="160" rx="18" fill="${color}" stroke="${ink}" stroke-width="5"/><text x="400" y="190" text-anchor="middle" ${font} font-size="70" fill="#fff">${esc(name)}</text>`,
    "어닝·실사": `<rect x="150" y="100" width="500" height="90" rx="10" fill="#fff" stroke="${ink}" stroke-width="5"/><text x="400" y="165" text-anchor="middle" ${font} font-size="58" fill="${color}">${esc(name)}</text>${Array.from({ length: 10 }, (_, i) => `<rect x="${110 + i * 58}" y="210" width="58" height="60" fill="${i % 2 ? "#fff" : color}"/>`).join("")}<rect x="110" y="210" width="580" height="60" fill="none" stroke="${ink}" stroke-width="5"/>`,
    "LED·네온": `<rect x="150" y="90" width="500" height="160" rx="18" fill="#0E1626" stroke="${color}" stroke-width="6"/><text x="400" y="192" text-anchor="middle" ${font} font-size="76" fill="none" stroke="${color}" stroke-width="4">${esc(name)}</text>`,
  }[type];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${night ? "#0B1220" : "#FBF5E9"}"/><g${zoom}><rect x="80" y="60" width="640" height="500" fill="${wall}" stroke="${ink}" stroke-width="6"/>${board}<rect x="130" y="300" width="300" height="260" fill="${glass}" stroke="${ink}" stroke-width="6"/><rect x="470" y="310" width="190" height="250" fill="#F4A261" stroke="${ink}" stroke-width="6"/><path d="M160 340 l60 -30 M160 380 l100 -50" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/></g><rect y="560" width="800" height="40" fill="#EADFC9"/></svg>`;
}
PF.forEach(([name, type, color], i) => [1, 2, 3].forEach(v => writeFileSync(new URL(`pf${String(i + 1).padStart(2, "0")}-${v}.svg`, out), sign(type, name, color, v))));
const card = (title, bg, emoji) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="${bg}"/><text x="400" y="210" text-anchor="middle" font-size="120">${emoji}</text><text x="400" y="330" text-anchor="middle" font-family="Jua, sans-serif" font-size="54" fill="#24332A">${esc(title)}</text></svg>`;
[["가을 간판 점검 이벤트", "#FFF1D6", "🍂"], ["추석 연휴 휴무 안내", "#E3F0F7", "📢"], ["고소작업차 새로 들였어요", "#E7F4EC", "🚚"]].forEach(([t, bg, e], i) => writeFileSync(new URL(`news-${i + 1}.svg`, out), card(t, bg, e)));
[["design", "간판 디자인", "#E7F4EC", "🎨"], ["make", "제작", "#FFF1D6", "🛠️"], ["install", "시공", "#E3F0F7", "🚚"]].forEach(([k, t, bg, e]) => writeFileSync(new URL(`about-${k}.svg`, out), card(t, bg, e)));
writeFileSync(new URL("placeholder.svg", out), card("대표 이미지를 선택해주세요", "#EEF1EF", "🖼️"));
writeFileSync(new URL("map.svg", out), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect width="600" height="300" fill="#EEF2E8"/><path d="M0 190 H600 M0 80 H600 M180 0 V300 M420 0 V300" stroke="#fff" stroke-width="22"/><path d="M0 190 H600 M180 0 V300" stroke="#FFE3A3" stroke-width="12"/><path d="M300 112 c-16 0 -28 12 -28 28 c0 22 28 48 28 48 s28 -26 28 -48 c0 -16 -12 -28 -28 -28z" fill="#E07A5F" stroke="#24332A" stroke-width="3"/><circle cx="300" cy="140" r="9" fill="#fff" stroke="#24332A" stroke-width="2"/><rect x="245" y="200" width="110" height="28" rx="14" fill="#fff" stroke="#24332A" stroke-width="2"/><text x="300" y="220" text-anchor="middle" font-family="Jua, sans-serif" font-size="16" fill="#24332A">그린나래</text></svg>`);
writeFileSync(new URL("og.svg", out), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#FBF5E9"/><rect x="60" y="60" width="1080" height="510" rx="36" fill="#2F8F57" stroke="#24332A" stroke-width="8"/><text x="600" y="300" text-anchor="middle" font-family="Jua, sans-serif" font-size="110" fill="#FFD166" stroke="#24332A" stroke-width="4">그린나래디자인</text><text x="600" y="420" text-anchor="middle" font-family="Jua, sans-serif" font-size="48" fill="#FBF5E9">간판 디자인 · 제작 · 시공</text></svg>`);
console.log("samples written");
