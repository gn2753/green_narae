import type { News, NewsCategory, Portfolio } from "@/domain/types";
import { base, image, pad, pfImage, type SeedCtx } from "./util";

/** gen-samples.mjs의 PF 목록과 같은 순서 (pf01 … pf12) */
const PORTFOLIOS: [title: string, signType: string, region: string, display: string, completed: number, description: string][] = [
  ["Café 온담", "채널간판", "세종", "세종 ○○카페", -12, "따뜻한 원목 톤 외관에 맞춰 초록 채널 글자를 얹었습니다. 밤에도 은은하게 보이도록 전면 발광 대신 측면 발광을 썼어요."],
  ["해봄 수학", "돌출간판", "대전", "대전 ○○수학", -26, "2층 학원이라 길에서 잘 보이도록 세로형 돌출간판과 창문 시트를 함께 작업했습니다. 학부모님들이 멀리서도 찾기 쉬워졌다고 해요."],
  ["밝은내과", "실내사인", "청주", "청주 ○○내과", -40, "접수처와 진료실 안내를 같은 색 체계로 정리했습니다. 어르신들도 읽기 쉽게 글자를 크게 키웠어요."],
  ["할매국수", "어닝·실사", "공주", "공주 ○○국수", -55, "줄무늬 어닝과 실사 간판으로 오래된 국숫집의 정겨운 분위기를 살렸습니다. 비 오는 날에도 손님이 처마 아래서 기다릴 수 있어요."],
  ["BAR 1984", "LED·네온", "세종", "세종 ○○바", -70, "어두운 외벽에 민트색 네온 라인으로 상호를 그렸습니다. 늦은 밤 골목에서 단연 눈에 띄는 간판이 되었어요."],
  ["꽃길플라워", "채널간판", "대전", "대전 ○○플라워", -90, "보라색 채널 글자로 꽃집의 산뜻한 느낌을 냈습니다. 쇼윈도와 어울리도록 간판 높이를 낮게 잡았어요."],
  ["숲속 키즈", "실내사인", "청주", "청주 ○○키즈", -110, "키즈카페 입구에 숲을 닮은 둥근 패널 사인을 달았습니다. 모서리를 모두 둥글게 처리해 아이들에게 안전해요."],
  ["24 편의점", "돌출간판", "공주", "공주 ○○편의점", -135, "24시간 영업을 알리는 돌출간판과 전면 간판을 함께 교체했습니다. 밤에도 밝게 보이도록 LED 모듈을 촘촘히 넣었어요."],
  ["초록 정육", "어닝·실사", "세종", "세종 ○○정육", -160, "초록 줄무늬 어닝으로 신선한 느낌을 강조했습니다. 실사 간판에는 대표 메뉴를 크게 넣었어요."],
  ["불맛치킨", "채널간판", "대전", "대전 ○○치킨", -190, "빨간 채널 글자로 불맛을 표현했습니다. 배달 기사님들도 쉽게 찾도록 측면에서도 잘 보이게 설치했어요."],
  ["온기 베이커리", "채널간판", "청주", "청주 ○○베이커리", -8, "갈색 채널 글자로 갓 구운 빵의 따뜻함을 담았습니다. 아침 햇살에 그림자가 예쁘게 지도록 띄움 시공을 했어요."],
  ["모아 안경", "LED·네온", "공주", "공주 ○○안경", -4, "하늘색 네온 라인으로 안경점의 깔끔한 이미지를 살렸습니다. 낮에도 형태가 잘 보이도록 테두리를 두껍게 잡았어요."],
];

export function buildPortfolios(ctx: SeedCtx): Portfolio[] {
  return PORTFOLIOS.map(([name, signType, region, clientDisplayName, completed, description], i) => {
    const n = i + 1; const id = `pf${pad(n)}`;
    const at = ctx.at(completed + 2, 14, 0);
    return {
      ...base(id, at),
      title: `${name} ${signType}`, signType, region, completedOn: ctx.day(completed), clientDisplayName, description,
      cover: image(`${id}-1`, pfImage(n, 1), "대표 이미지(주간).svg", "kim", at),
      images: [image(`${id}-2`, pfImage(n, 2), "야간 사진.svg", "kim", at), image(`${id}-3`, pfImage(n, 3), "근접 사진.svg", "kim", at)],
      published: n <= 10, order: n,
    };
  });
}

const NEWS: [category: NewsCategory, title: string, summary: string, body: string, published: number, cover: number | null, pinned: boolean][] = [
  ["event", "가을 간판 점검 이벤트", "10월 한 달간 기존 간판 무료 점검을 해드려요.", "찬 바람이 불기 전에 간판 상태를 미리 살펴보세요.\n10월 한 달 동안 세종·대전·청주·공주 지역 간판을 무료로 점검해 드립니다.\nLED 불량, 전선 노후, 고정 상태를 함께 확인해요. 문의 게시판이나 전화로 신청해주세요.", -3, 1, true],
  ["notice", "추석 연휴 휴무 안내", "연휴 기간에는 상담과 시공을 쉽니다.", "추석 연휴 기간에는 상담·시공을 쉽니다.\n연휴 중 남겨주신 문의는 연휴가 끝난 다음 날부터 차례대로 연락드릴게요.\n즐거운 명절 보내세요.", -20, 2, false],
  ["news", "고소작업차 새로 들였어요", "높은 곳 간판도 더 빠르고 안전하게 시공합니다.", "3층 이상 높은 곳 간판도 이제 직접 시공할 수 있게 고소작업차를 새로 들였습니다.\n외부 장비 일정을 기다리지 않아도 되어 시공 기간이 짧아졌어요.", -34, 3, false],
  ["news", "LED 채널간판, 전기요금 아끼는 법", "타이머와 밝기 조절만으로도 차이가 커요.", "채널간판은 켜는 시간과 밝기만 조절해도 전기요금을 꽤 줄일 수 있습니다.\n영업시간에 맞춘 타이머 설치, 늦은 밤 밝기 낮추기 등 간단한 방법을 소개해 드려요.", -48, null, false],
  ["notice", "홈페이지를 새로 열었습니다", "시공 사례와 견적 문의를 한곳에서 보실 수 있어요.", "그린나래디자인 홈페이지를 새로 열었습니다.\n그동안 작업한 시공 사례를 보시고, 견적 문의도 편하게 남겨주세요.", -60, null, false],
  ["news", "작은 가게 간판, 이렇게 고르세요", "가게 폭·업종·예산에 맞는 간판 종류를 정리했어요.", "처음 가게를 여는 사장님들이 가장 많이 물어보시는 질문을 모았습니다.\n채널간판, 돌출간판, 어닝, 실내사인 중 무엇이 맞는지 가게 폭과 예산 기준으로 정리했어요.", -75, null, false],
];

export function buildNews(ctx: SeedCtx): News[] {
  return NEWS.map(([category, title, summary, body, published, cover, pinned], i) => {
    const id = `n${pad(i + 1)}`; const at = ctx.at(published, 9, 30);
    return {
      ...base(id, at), category, title, summary, body,
      ...(cover ? { cover: image(`${id}-cover`, `/samples/news-${cover}.svg`, "대표 이미지.svg", "kim", at) } : {}),
      publishedOn: ctx.day(published), pinned, published: true,
    };
  });
}
