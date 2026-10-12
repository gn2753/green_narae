import "./hero.css";
import { HERO_SCRIPT } from "./heroScript";

// 말풍선 윤곽(원본 시안에서 손으로 맞춘 경로). 인덱스는 HERO_SCRIPT 와 동일.
const DESIGNER_BUBBLES = [
  { d: "M12 150 h138 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-90 l-12 14 l0 -14 h-36 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z", x: 86 },
  { d: "M12 150 h168 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-120 l-12 14 l0 -14 h-36 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z", x: 101 },
  { d: "M12 150 h150 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-102 l-12 14 l0 -14 h-36 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z", x: 92 },
  { d: "M12 150 h150 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-102 l-12 14 l0 -14 h-36 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z", x: 92 },
  { d: "M12 150 h160 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-112 l-12 14 l0 -14 h-36 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z", x: 97 },
];
const INSTALLER_BUBBLES: { d: string; x: number; fontSize?: number }[] = [
  { d: "M398 40 h80 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-58 l-22 18 l6 -18 h-6 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z", x: 438 },
  { d: "M398 40 h80 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-58 l-22 18 l6 -18 h-6 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z", x: 438 },
  { d: "M398 40 h100 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-78 l-22 18 l6 -18 h-6 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z", x: 448 },
  { d: "M398 40 h80 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-58 l-22 18 l6 -18 h-6 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z", x: 438 },
  { d: "M392 40 h106 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-78 l-28 18 l6 -18 h-6 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z", x: 445, fontSize: 15 },
];

const SIGN_CHARS = [
  { ch: "그", x: 186 },
  { ch: "린", x: 222 },
  { ch: "나", x: 258 },
  { ch: "래", x: 294 },
];

export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 380"
      role="img"
      aria-label="고소작업차 위 시공기사와 아래의 디자이너가 대화하며 그린나래 간판을 다는 애니메이션"
      className={className ? `hero-scene ${className}` : "hero-scene"}
    >
      <g stroke="#24332A" strokeLinecap="round" strokeLinejoin="round">
        {/* sun */}
        <g className="rays" stroke="#F2B632" strokeWidth="3">
          <path d="M470 12v-8M470 92v-8M434 48h-8M514 48h-8M445 23l-6-6M501 79l-6-6M495 23l6-6M445 73l-6 6" />
        </g>
        <circle cx="470" cy="48" r="24" fill="#FFD166" strokeWidth="3" />
        {/* clouds */}
        <g className="cloud"><path d="M40 52 q8-16 26-8 q12-12 26 2 q14 0 12 13 h-60 q-12-1-4-7z" fill="#fff" strokeWidth="2.5" /></g>
        <g className="cloud c2"><path d="M300 26 q6-12 20-6 q10-9 20 2 q11 0 9 10 h-46 q-9-1-3-6z" fill="#fff" strokeWidth="2.5" /></g>
        {/* birds */}
        <g className="birds" fill="none" strokeWidth="2"><path className="wing" d="M0 0 q5-5 10 0 q5-5 10 0" /><path className="wing" d="M26 10 q4-4 8 0 q4-4 8 0" /></g>

        {/* building */}
        <rect x="62" y="52" width="316" height="14" rx="3" fill="#E9DFCC" strokeWidth="3" />
        <rect x="70" y="64" width="300" height="276" fill="#FFFDF7" strokeWidth="3" />
        <g stroke="#E6D9C2" strokeWidth="2"><path d="M80 146h22M118 146h22M300 146h22M338 146h22M90 186h18M330 186h18" /></g>

        {/* SIGN (animated) */}
        <g className="sign">
          <rect x="88" y="74" width="266" height="62" rx="10" fill="#2F8F57" strokeWidth="3" />
          <rect x="95" y="81" width="252" height="48" rx="7" fill="none" stroke="#BDE8C9" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M108 124 C108 100 122 90 142 90 C142 112 130 124 108 124Z" fill="#BDE8C9" strokeWidth="2.5" />
          <path d="M110 122 L130 102" strokeWidth="2" />
          {SIGN_CHARS.map(({ ch, x }) => (
            <text key={ch} className="jua" x={x} y="118" textAnchor="middle" fontSize="36" fill="#fff" stroke="none">{ch}</text>
          ))}
          <g className="lights" stroke="none">
            {SIGN_CHARS.map(({ ch, x }, i) => (
              <g key={ch} className={`ch ch${i + 1}`}>
                <text className="jua breath" x={x} y="118" textAnchor="middle" fontSize="36" fill="#FF8A2A">{ch}</text>
              </g>
            ))}
          </g>
          <text className="noto" x="318" y="128" textAnchor="end" fontWeight="700" fontSize="8" letterSpacing="2" fill="#BDE8C9" stroke="none">DESIGN · SIGN</text>
        </g>

        {/* awning */}
        <path d="M80 152 h280 l-12 28 h-256z" fill="#F7E3C1" strokeWidth="3" />
        <path d="M120 152 l-6 28 M162 152 l-3 28 M204 152 v28 M246 152 l3 28 M288 152 l6 28 M330 152 l8 28" stroke="#E07A5F" strokeWidth="8" />
        <path d="M80 152 h280 l-12 28 h-256z" fill="none" strokeWidth="3" />
        <path d="M92 180 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0 q9 8 18 0" fill="#F7E3C1" strokeWidth="2.5" />
        {/* window */}
        <rect x="94" y="200" width="142" height="140" rx="4" fill="#CFE8F3" strokeWidth="3" />
        <path d="M110 222 l26-12 M110 240 l44-22" stroke="#fff" strokeWidth="5" />
        <path d="M165 200 v140" strokeWidth="2.5" />
        {/* plant in window */}
        <path d="M120 340 l4-24 h22 l4 24z" fill="#E07A5F" strokeWidth="2.5" />
        <path d="M135 316 q-18-14-12-34 q12 10 12 34 q4-26 18-32 q4 20-18 32" fill="#6CC28A" strokeWidth="2.5" />
        {/* open sign */}
        <path d="M190 210 l10 14 M220 210 l-10 14" strokeWidth="1.5" />
        <rect x="186" y="224" width="38" height="18" rx="4" fill="#fff" strokeWidth="2" />
        <text className="jua" x="205" y="237" textAnchor="middle" fontSize="11" fill="#E07A5F" stroke="none">OPEN</text>
        {/* door */}
        <rect x="254" y="200" width="92" height="140" rx="4" fill="#F4A261" strokeWidth="3" />
        <rect x="266" y="214" width="68" height="70" rx="3" fill="#CFE8F3" strokeWidth="2.5" />
        <path d="M276 232 l18-10" stroke="#fff" strokeWidth="4" />
        <rect x="326" y="290" width="6" height="22" rx="3" fill="#24332A" strokeWidth="1" />

        {/* sidewalk */}
        <rect x="0" y="340" width="520" height="22" fill="#EADFC9" stroke="none" />
        <path d="M0 340 H520" strokeWidth="3" />
        <path d="M40 340v22M110 340v22M180 340v22M250 340v22M320 340v22M390 340v22M460 340v22" stroke="#D3C5AA" strokeWidth="2" />

        {/* cat */}
        <g>
          <path className="tail" d="M262 330 q16-6 14-26" fill="none" stroke="#E08A3C" strokeWidth="5" />
          <ellipse cx="250" cy="332" rx="16" ry="9" fill="#F4A261" strokeWidth="2.5" />
          <circle cx="236" cy="320" r="9" fill="#F4A261" strokeWidth="2.5" />
          <path d="M229 314 l1-9 l6 5z M239 310 l6-4 l0 9z" fill="#F4A261" strokeWidth="2" />
          <circle cx="233" cy="320" r="1.3" fill="#24332A" stroke="none" /><circle cx="239" cy="320" r="1.3" fill="#24332A" stroke="none" />
          <path d="M243 336 v4 M256 336 v4" strokeWidth="2.5" />
        </g>

        {/* cones */}
        <path d="M354 340 l8-26 l8 26z" fill="#F28C28" strokeWidth="2.5" /><path d="M357 330 h10" stroke="#fff" strokeWidth="3" />
        <path d="M350 340 h24" strokeWidth="3" />

        {/* bucket truck */}
        <path d="M382 318 v18" strokeWidth="5" /><rect x="374" y="334" width="16" height="6" rx="2" fill="#9AA3B2" strokeWidth="2" />
        <rect x="372" y="298" width="112" height="24" rx="4" fill="#F2B632" strokeWidth="3" />
        <path d="M372 312 h112" stroke="#24332A" strokeWidth="2" />
        <path d="M378 306 h20 M404 306 h20 M430 306 h20" stroke="#fff" strokeWidth="3" />
        <path d="M484 322 V282 h18 l14 20 v20z" fill="#F2B632" strokeWidth="3" />
        <path d="M488 288 h12 l9 13 h-21z" fill="#CFE8F3" strokeWidth="2" />
        <path d="M492 312 C492 306 496 304 500 304 C500 309 497 312 492 312Z" fill="#2F8F57" strokeWidth="1.5" />
        <circle cx="400" cy="326" r="13" fill="#24332A" strokeWidth="2" /><circle cx="400" cy="326" r="5" fill="#D9DDE3" strokeWidth="2" />
        <circle cx="494" cy="326" r="13" fill="#24332A" strokeWidth="2" /><circle cx="494" cy="326" r="5" fill="#D9DDE3" strokeWidth="2" />
        <rect x="391" y="286" width="28" height="14" rx="3" fill="#E9E4D8" strokeWidth="2.5" />

        <g className="boom">
          {/* boom arm */}
          <path d="M405 292 L374 196" stroke="#24332A" strokeWidth="13" />
          <path d="M405 292 L374 196" stroke="#F5F2EA" strokeWidth="8" />
          <path d="M398 270 L384 226" stroke="#9AA3B2" strokeWidth="3" />
          <circle cx="405" cy="292" r="6" fill="#9AA3B2" strokeWidth="2.5" />

          {/* installer (behind bucket) */}
          <g className="bob">
            <rect x="348" y="140" width="30" height="40" rx="9" fill="#F28C28" strokeWidth="3" />
            <path d="M350 154 h26 M350 164 h26" stroke="#F5F5F5" strokeWidth="3.5" />
            <path d="M354 142 l8 36 M372 142 l-8 36" stroke="#2F8F57" strokeWidth="2.5" />
            <path d="M362 138 v4" strokeWidth="2" />
            <circle cx="363" cy="124" r="13" fill="#FFDDB8" strokeWidth="3" />
            <circle cx="375" cy="126" r="3" fill="#FFDDB8" strokeWidth="2" />
            <circle cx="357" cy="124" r="1.6" fill="#24332A" stroke="none" />
            <circle cx="364" cy="124" r="1.6" fill="#24332A" stroke="none" />
            <path d="M357 130 q4 3 7 0" fill="none" strokeWidth="1.8" />
            <circle cx="354" cy="128" r="2.4" fill="#F7A1A1" stroke="none" />
            <path d="M348 119 q15-26 30 0 z" fill="#fff" strokeWidth="3" />
            <path d="M344 119 h38" strokeWidth="3.5" />
            <path d="M363 99 v19" stroke="#2F8F57" strokeWidth="3" />
            {/* drilling arm */}
            <g className="drillarm">
              <path d="M352 150 L340 128" stroke="#24332A" strokeWidth="10" />
              <path d="M352 150 L340 128" stroke="#F28C28" strokeWidth="6" />
              <circle cx="339" cy="125" r="5" fill="#8B6A3E" strokeWidth="2" />
              <rect x="324" y="114" width="20" height="10" rx="3" fill="#E63946" strokeWidth="2.5" />
              <rect x="334" y="120" width="7" height="11" rx="2" fill="#24332A" strokeWidth="1.5" />
              <path d="M324 119 h-9" stroke="#9AA3B2" strokeWidth="3" />
              <g className="sparks" stroke="#F2B632" strokeWidth="2.5"><path d="M312 111 l-6-6 M311 119 h-9 M312 127 l-6 6 M318 108 l-1-8" /></g>
            </g>
          </g>
          {/* bucket */}
          <rect x="334" y="172" width="58" height="34" rx="4" fill="#F2B632" strokeWidth="3" />
          <path d="M334 182 h58" strokeWidth="2" />
          <text className="jua" x="363" y="199" textAnchor="middle" fontSize="10" fill="#24332A" stroke="none">그린나래</text>
          <path d="M392 190 L380 200" strokeWidth="3" />
        </g>

        {/* designer */}
        <g>
          <ellipse cx="48" cy="340" rx="26" ry="4" fill="#D3C5AA" stroke="none" />
          <rect x="36" y="296" width="10" height="42" rx="3" fill="#3D5A80" strokeWidth="2.5" />
          <rect x="50" y="296" width="10" height="42" rx="3" fill="#3D5A80" strokeWidth="2.5" />
          <path d="M32 340 q0-6 8-6 h7 v6z M48 340 v-6 h8 q8 0 8 6z" fill="#24332A" strokeWidth="2" />
          <rect x="28" y="244" width="40" height="58" rx="13" fill="#2F8F57" strokeWidth="3" />
          <path d="M36 248 v52 M60 248 v52" stroke="#25744A" strokeWidth="2" />
          <path d="M42 262 C42 254 46 251 52 251 C52 257 48 262 42 262Z" fill="#fff" strokeWidth="1.5" />
          <rect x="44" y="236" width="8" height="10" fill="#FFDDB8" strokeWidth="2" />
          <circle cx="48" cy="222" r="16" fill="#FFDDB8" strokeWidth="3" />
          <path d="M31 226 q-4-26 17-26 q21 0 17 26 q-2-12-10-16 q-8 8-22 6 q-2 4-2 10z" fill="#4A3426" strokeWidth="2.5" />
          <circle cx="43" cy="225" r="4.5" fill="#fff" fillOpacity=".5" strokeWidth="2" />
          <circle cx="54" cy="225" r="4.5" fill="#fff" fillOpacity=".5" strokeWidth="2" />
          <path d="M47.5 225 h2" strokeWidth="2" />
          <circle cx="43" cy="225" r="1.2" fill="#24332A" stroke="none" /><circle cx="54" cy="225" r="1.2" fill="#24332A" stroke="none" />
          <path d="M45 232 q3 3 7 0" fill="none" strokeWidth="1.8" />
          <circle cx="38" cy="231" r="2.4" fill="#F7A1A1" stroke="none" />
          {/* tablet arm */}
          <path d="M32 258 L28 282" stroke="#24332A" strokeWidth="10" /><path d="M32 258 L28 282" stroke="#2F8F57" strokeWidth="6" />
          <rect x="14" y="274" width="32" height="24" rx="4" fill="#24332A" strokeWidth="2" />
          <rect x="17" y="277" width="26" height="18" rx="2" fill="#fff" stroke="none" />
          <rect x="20" y="282" width="20" height="8" rx="2" fill="#2F8F57" stroke="none" />
          <circle cx="28" cy="286" r="4.5" fill="#FFDDB8" strokeWidth="2" />
          {/* pointing arm */}
          <g className="point">
            <path d="M60 256 L84 228" stroke="#24332A" strokeWidth="10" /><path d="M60 256 L84 228" stroke="#2F8F57" strokeWidth="6" />
            <circle cx="86" cy="226" r="5" fill="#FFDDB8" strokeWidth="2" />
            <path d="M88 222 l5-7" strokeWidth="3" />
            <g className="thumb"><path d="M84 220 v-8" strokeWidth="3.5" /></g>
          </g>
        </g>
      </g>

      {/* speech bubbles: designer */}
      <g className="jua" fontSize="16" fill="#24332A">
        {HERO_SCRIPT.map((line, i) => (
          <g key={`d${i}`} className={`bub t${i + 1}`}>
            <path d={DESIGNER_BUBBLES[i].d} fill="#fff" stroke="#24332A" strokeWidth="2.5" />
            <text x={DESIGNER_BUBBLES[i].x} y="176" textAnchor="middle">{line.designer}</text>
          </g>
        ))}
      </g>
      {/* speech bubbles: installer */}
      <g className="jua" fontSize="16" fill="#24332A">
        {HERO_SCRIPT.map((line, i) => (
          <g key={`r${i}`} className={`rep r${i + 1}`}>
            <path d={INSTALLER_BUBBLES[i].d} fill="#fff" stroke="#24332A" strokeWidth="2.5" />
            <text x={INSTALLER_BUBBLES[i].x} y="65" textAnchor="middle" fontSize={INSTALLER_BUBBLES[i].fontSize}>{line.installer}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default HeroScene;
