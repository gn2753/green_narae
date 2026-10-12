export type Phase = "1차 동작" | "1차 화면" | "2차";

export type Feature = {
  id: string;
  group: string;
  title: string;
  path: string;
  summary: string;
  items: { text: string; phase: Phase }[];
};

export type Decision = { title: string; options: string[]; recommendation: string };

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  "1차 동작": "화면도 있고, 이 시안에서 직접 눌러 보면 실제로 저장·변경됩니다 (입력은 이 브라우저에만 저장).",
  "1차 화면": "화면과 설정만 먼저 보여 드립니다. 실제 연결은 2차에서 합니다 (누르면 안내 문구가 나와요).",
  "2차": "이번 시안에는 없고, 다음 단계에서 실제로 만들 기능입니다.",
};

export const GROUPS = [
  "고객용 홈페이지",
  "업무·고객 관리",
  "제작·매입매출·정산",
  "고객 응대·홈페이지 운영",
  "추가 요청",
] as const;

export const FEATURES: Feature[] = [
  // ---- 고객용 홈페이지 ----
  {
    id: "P01", group: "고객용 홈페이지", title: "홈", path: "/",
    summary: "처음 보는 손님에게 회사를 소개하고 문의로 이어 주는 첫 화면",
    items: [
      { text: "움직이는 간판 점등 일러스트와 상담 신청·시공사례 버튼", phase: "1차 동작" },
      { text: "강점 3가지, 작업과정 6단계 안내", phase: "1차 동작" },
      { text: "대표 시공사례 10개: 종류별 필터, 카드 누르면 사진 갤러리 상세", phase: "1차 동작" },
      { text: "최근 소식 3개와 소식 더보기", phase: "1차 동작" },
      { text: "문의 폼 (보내면 관리자 문의 목록에 바로 생성)", phase: "1차 동작" },
      { text: "오시는 길: 주소·영업시간, 지도 자리 (카카오맵·네이버 지도 버튼은 안내만)", phase: "1차 화면" },
      { text: "카톡 상담·전화 버튼 실제 연결", phase: "2차" },
    ],
  },
  {
    id: "P02", group: "고객용 홈페이지", title: "회사·서비스 소개", path: "/about",
    summary: "두 대표 인사말, 디자인·제작·시공 서비스, 간판 종류와 보유 장비 소개",
    items: [
      { text: "인사말과 두 대표 소개, 서비스 3축 (디자인·제작·시공)", phase: "1차 동작" },
      { text: "간판 종류별 소개 (누르면 해당 포트폴리오로 이동)", phase: "1차 동작" },
      { text: "작업과정, 보유 장비, 문의 안내", phase: "1차 동작" },
    ],
  },
  {
    id: "P03", group: "고객용 홈페이지", title: "포트폴리오", path: "/portfolio",
    summary: "시공사례를 간판 종류별로 골라 보는 화면",
    items: [
      { text: "분야별 필터 칩과 카드 목록 (PC 5열 / 태블릿 3열 / 모바일 2열)", phase: "1차 동작" },
      { text: "상세 창: 대표 사진과 추가 사진 넘겨 보기, 지역·시공일·작업 설명", phase: "1차 동작" },
      { text: "관리자(A10)에서 올린 사례가 여기에 반영됨", phase: "1차 동작" },
      { text: "실제 시공 사진으로 교체", phase: "2차" },
    ],
  },
  {
    id: "P04", group: "고객용 홈페이지", title: "소식·공지", path: "/news",
    summary: "새 소식, 공지, 이벤트를 알리는 게시판",
    items: [
      { text: "전체 / 소식 / 공지 / 이벤트 탭, 상단 고정 글 먼저 표시", phase: "1차 동작" },
      { text: "글 상세: 본문, 이전 글·다음 글, 목록으로", phase: "1차 동작" },
      { text: "관리자(A10)에서 쓴 글이 여기에 반영됨", phase: "1차 동작" },
    ],
  },
  {
    id: "P05", group: "고객용 홈페이지", title: "견적·문의", path: "/contact",
    summary: "회원가입 없이 바로 견적을 문의하는 화면",
    items: [
      { text: "문의 폼: 이름·연락처·이메일·내용 확인 후 개인정보 동의 (형식이 틀리면 안내)", phase: "1차 동작" },
      { text: "문의 접수 시 관리자 A09 문의 목록에 '미답변'으로 생성 + 완료 안내 창", phase: "1차 동작" },
      { text: "연락처 정보와 오시는 길 (지도 버튼은 안내만)", phase: "1차 화면" },
      { text: "지도 실제 연결", phase: "2차" },
    ],
  },
  {
    id: "MEMBER", group: "고객용 홈페이지", title: "회원 서비스", path: "/member",
    summary: "로그인·회원가입 자리 (지금은 '준비 중' 화면)",
    items: [
      { text: "'준비 중' 안내 화면", phase: "1차 화면" },
      { text: "회원가입·로그인, 마이페이지에서 내 의뢰 진행 확인", phase: "2차" },
    ],
  },

  // ---- 업무·고객 관리 ----
  {
    id: "A01", group: "업무·고객 관리", title: "대시보드", path: "/admin",
    summary: "로그인하면 처음 보이는 오늘의 업무 현황판",
    items: [
      { text: "오늘 할 일·지연·긴급·미답변 문의·미수금·오늘 방문자 카드 (누르면 해당 목록으로)", phase: "1차 동작" },
      { text: "김자연 대표이사 / 최관웅 대표별 오늘 할 일 2열", phase: "1차 동작" },
      { text: "의뢰 진행 흐름 막대 (5단계 건수)", phase: "1차 동작" },
      { text: "이번 주 일정과 최근 문의 3건", phase: "1차 동작" },
    ],
  },
  {
    id: "A02", group: "업무·고객 관리", title: "업무·일정 관리", path: "/admin/tasks",
    summary: "기존 업무판(파트별 업무)과 의뢰 진행 보드 두 탭 (의뢰 진행 탭은 /admin/projects)",
    items: [
      { text: "파트별 업무: 디자인·실측미팅·시공 및 납품·견적·대기·기타 행정 6개 칸", phase: "1차 동작" },
      { text: "파트 인계: 디자인 완료 시 시공 및 납품으로, 미팅 완료 시 견적으로 자동 이동", phase: "1차 동작" },
      { text: "오늘·전체·지연·완료 탭, 담당자 필터, 업무 등록·수정, 빠른 완료 체크", phase: "1차 동작" },
      { text: "의뢰 진행: 상담·실측, 견적, 디자인, 시공·납품, 정산·완료 5단계 칸반", phase: "1차 동작" },
      { text: "다음 단계로 이동, 대기 사유 표시, 지연 빨간 표시, 의뢰 상세 (고객·견적·발주·입금 연결)", phase: "1차 동작" },
      { text: "의뢰 상세에서 '시공사례로 등록' (A10에 비공개 초안 생성)", phase: "1차 동작" },
      { text: "기존 운영 데이터 이관", phase: "2차" },
    ],
  },
  {
    id: "A03", group: "업무·고객 관리", title: "고객리스트 관리", path: "/admin/customers",
    summary: "고객 정보와 그 고객의 모든 기록을 한곳에서 보는 화면",
    items: [
      { text: "고객 목록: 검색·정렬, 진행 중 의뢰 수, 미수금, 최근 연락일", phase: "1차 동작" },
      { text: "고객 상세 탭: 의뢰·업무 / 견적·계약 / 입금 내역 / 문의·상담 이력", phase: "1차 동작" },
      { text: "고객 등록·수정 (같은 연락처가 있으면 중복 경고)", phase: "1차 동작" },
    ],
  },
  {
    id: "A04", group: "업무·고객 관리", title: "견적·계약 관리", path: "/admin/contracts",
    summary: "견적 금액부터 계약, 계약금·잔금 일정까지 관리",
    items: [
      { text: "목록과 상태 필터 (견적작성, 견적발송, 계약완료, 취소)", phase: "1차 동작" },
      { text: "견적·계약 등록·수정: 금액, 계약일, 계약금·잔금 금액과 입금 예정일", phase: "1차 동작" },
      { text: "계약완료로 바꾸면 A07 입금 예정 항목(계약금·잔금) 자동 생성", phase: "1차 동작" },
    ],
  },

  // ---- 제작·매입매출·정산 ----
  {
    id: "A05", group: "제작·매입매출·정산", title: "제작업체·발주 관리", path: "/admin/orders",
    summary: "제작업체 명단과 업체별 발주 현황",
    items: [
      { text: "제작업체 목록·등록 (분야, 담당자, 연락처)", phase: "1차 동작" },
      { text: "발주 목록·등록: 금액, 발주일, 납기, 상태 (의뢰, 제작중, 출고, 수령완료)", phase: "1차 동작" },
      { text: "수령완료 시 'A06 매입으로 등록할까요?' 제안", phase: "1차 동작" },
    ],
  },
  {
    id: "A06", group: "제작·매입매출·정산", title: "매입·매출 관리", path: "/admin/ledger",
    summary: "들어오고 나간 돈을 기록하고 기간별로 집계",
    items: [
      { text: "매입 등록 (비용 항목: 자재비 / 외주제작 / 장비·차량 / 운반 / 기타)", phase: "1차 동작" },
      { text: "매출 등록 (A07 입금 확인 시 자동 제안)", phase: "1차 동작" },
      { text: "기간(월·분기·연·직접) 집계: 매출·매입·차액, 월별 막대 그래프, 비용 항목 비율, 의뢰별 손익", phase: "1차 동작" },
    ],
  },
  {
    id: "A07", group: "제작·매입매출·정산", title: "계약금·잔금 관리", path: "/admin/payments",
    summary: "받을 돈과 받은 돈, 못 받은 돈(미수금)을 확인",
    items: [
      { text: "목록: 구분(계약금·잔금·추가), 입금 예정일, 상태 (예정 / 미수 / 입금확인)", phase: "1차 동작" },
      { text: "입금 확인 처리: 입금일, 이체 증빙 첨부, 확인자 기록 후 매출 등록 제안", phase: "1차 동작" },
      { text: "이번 달 입금 예정, 미수금 합계, 정산 완료 의뢰 수 요약", phase: "1차 동작" },
      { text: "모든 입금이 확인되면 해당 의뢰에 '정산 완료' 표시", phase: "1차 동작" },
    ],
  },
  {
    id: "A08", group: "제작·매입매출·정산", title: "자료·인쇄", path: "/admin/print",
    summary: "업무표 인쇄와 엑셀용 자료 내려받기",
    items: [
      { text: "전체 업무 A4 세로 인쇄 (파트별 색상·구분선, 빈 비고란)", phase: "1차 동작" },
      { text: "선택 인쇄: 파트·담당자·기간·상태 필터 또는 체크한 업무만", phase: "1차 동작" },
      { text: "CSV 내보내기: 업무·고객·견적계약·매입매출·입금 내역 (엑셀에서 열림)", phase: "1차 동작" },
    ],
  },

  // ---- 고객 응대·홈페이지 운영 ----
  {
    id: "A09", group: "고객 응대·홈페이지 운영", title: "고객 문의·답변", path: "/admin/inquiries",
    summary: "홈페이지·전화·카톡 등 모든 문의가 모이는 유일한 창구",
    items: [
      { text: "문의 목록: 미답변 / 답변완료 / 종료 탭, NEW 표시, 경로 아이콘", phase: "1차 동작" },
      { text: "문의 직접 등록 (전화·카톡·방문·메일로 받은 문의 수기 입력)", phase: "1차 동작" },
      { text: "담당자 지정, 기존 고객 자동 찾기·연결", phase: "1차 동작" },
      { text: "답변 기록 (일시·작성자·전달 방식·내용) 후 자동 '답변완료'", phase: "1차 동작" },
      { text: "'고객 등록 + 의뢰 시작' 버튼 (고객과 의뢰가 한 번에 생성)", phase: "1차 동작" },
      { text: "이메일 답장 발송 (1차는 답변 기록만)", phase: "2차" },
    ],
  },
  {
    id: "A10", group: "고객 응대·홈페이지 운영", title: "홈페이지 콘텐츠 관리", path: "/admin/content",
    summary: "홈페이지의 시공사례와 소식을 직접 올리고 고치는 화면 (탭: 포트폴리오 / 소식)",
    items: [
      { text: "포트폴리오 목록·편집: 대표 이미지, 추가 이미지 순서 변경, 공개 여부, 노출 순서", phase: "1차 동작" },
      { text: "소식 목록·편집: 분류, 본문, 대표 이미지, 게시일, 상단 고정, 공개 여부", phase: "1차 동작" },
      { text: "고친 내용이 고객용 홈페이지(P01·P03·P04)에 바로 반영됨", phase: "1차 동작" },
      { text: "사진 실제 업로드 저장소 연결", phase: "2차" },
    ],
  },
  {
    id: "A11", group: "고객 응대·홈페이지 운영", title: "달력·알림", path: "/admin/calendar",
    summary: "일정을 달력으로 보고 알림을 설정하는 화면",
    items: [
      { text: "월/주 달력: 업무·실측·시공·입금 예정, 담당자 색과 필터, 누르면 상세", phase: "1차 동작" },
      { text: "오전 9:30 요약 설정 화면 (켜기/끄기, 시간, 받는 사람, 포함 항목)", phase: "1차 화면" },
      { text: "오전 9:30 요약 발송", phase: "2차" },
      { text: "새 문의 즉시 알림·휴대폰 등록 설정 화면", phase: "1차 화면" },
      { text: "휴대폰 알림 실제 연결", phase: "2차" },
      { text: "Google Calendar 연동 (두 방식 설명과 '연동 예정' 버튼)", phase: "1차 화면" },
      { text: "Google Calendar 실제 연동", phase: "2차" },
    ],
  },
  {
    id: "A12", group: "고객 응대·홈페이지 운영", title: "사용자·권한 설정", path: "/admin/settings",
    summary: "누가 관리자에 들어올 수 있는지, 백업과 기본값 설정",
    items: [
      { text: "허용 사용자 2명(김자연·최관웅)과 권한 표, 접근 제한 안내", phase: "1차 화면" },
      { text: "전체 데이터 JSON 내보내기·가져오기 (백업)", phase: "1차 동작" },
      { text: "데모 데이터 초기화", phase: "1차 동작" },
      { text: "분류값 설정: 파트·대기 사유·간판 종류·매입 항목·발주 상태·소식 분류", phase: "1차 동작" },
      { text: "실제 로그인(허용 목록 계정만 접근), 자동 백업 일정", phase: "2차" },
    ],
  },

  // ---- 추가 요청 ----
  {
    id: "STATS", group: "추가 요청", title: "방문 통계", path: "/admin/stats",
    summary: "홈페이지에 몇 명이 어디서 들어왔는지 보는 화면",
    items: [
      { text: "오늘 / 이번 주 / 전체 방문자, 일별 그래프, 페이지별 방문자, 유입 경로, 기기 (샘플 숫자로 표시)", phase: "1차 화면" },
      { text: "전일·전주 대비 증감, 문의 전환율 (샘플 숫자로 표시)", phase: "1차 화면" },
      { text: "방문자 실제 수집 (하루 1회 중복 제외, 관리자·봇 제외)", phase: "2차" },
    ],
  },
];

export const DECISIONS: Decision[] = [
  {
    title: "Google Calendar 연동 방식",
    options: [
      "읽기 전용 ICS 구독 주소: 간단하지만 한쪽 방향(우리 달력에서 Google로)",
      "Google Calendar API: 양방향이지만 로그인 허용(OAuth) 설정이 필요",
    ],
    recommendation: "먼저 ICS 구독으로 시작하고, 필요해지면 API로 확장하는 것을 권장합니다.",
  },
  {
    title: "카카오톡 채널 주소",
    options: ["카카오톡 채널 주소를 알려 주세요 (상담 버튼과 푸터에 연결)", "채널이 아직 없으면 개설 후 알려 주세요"],
    recommendation: "채널 주소를 받으면 2차에서 카톡 상담 버튼에 바로 연결합니다.",
  },
  {
    title: "실제 연락처·주소·사업자 정보",
    options: ["대표 전화, 이메일, 사업장 주소, 영업시간, 사업자등록번호 확인", "지금 화면의 값은 모두 임시 값입니다"],
    recommendation: "정확한 정보를 알려 주시면 홈페이지·푸터·지도에 한 번에 반영합니다.",
  },
  {
    title: "누적 시공 수",
    options: ["홈 첫 화면의 누적 시공 수치(지금은 임시 값 320+)를 실제 숫자로 교체", "숫자를 공개하고 싶지 않으면 문구만 남기기"],
    recommendation: "대략적인 실제 숫자를 알려 주세요.",
  },
  {
    title: "포트폴리오 실제 사진",
    options: ["지금은 샘플 그림입니다. 실제 시공 사진과 설명 준비", "거래처 이름을 일부 가려서 표시할지 확인"],
    recommendation: "대표 사진 10장 정도를 먼저 보내 주시면 홈에 반영하고, 나머지는 관리자 화면에서 직접 올릴 수 있습니다.",
  },
];

export const OUT_OF_SCOPE_NOTE =
  "범위 밖: 블로그·SNS 게시자료 변환(A13)은 웹사이트에 포함하지 않고 ChatGPT Skill·MCP로 별도 진행합니다. 웹사이트는 2차에 시공사례 데이터를 외부 도구가 읽을 수 있는 연결 지점만 검토합니다.";

export const REVIEW_STEPS: { title: string; detail: string; path: string }[] = [
  { title: "홈 둘러보기", detail: "움직이는 일러스트, 시공사례, 소식을 살펴보세요.", path: "/" },
  { title: "문의 남기기", detail: "견적·문의에서 손님이 된 것처럼 문의를 하나 보내 보세요.", path: "/contact" },
  { title: "관리자 로그인", detail: "'김자연으로 보기' 또는 '최관웅으로 보기'를 누르세요.", path: "/admin" },
  { title: "A09에서 방금 문의 확인", detail: "방금 보낸 문의가 '미답변'으로 들어와 있어요.", path: "/admin/inquiries" },
  { title: "답변 기록", detail: "답변 내용을 적으면 '답변완료'로 바뀝니다.", path: "/admin/inquiries" },
  { title: "고객 등록 + 의뢰 시작", detail: "버튼 하나로 고객과 의뢰가 만들어집니다.", path: "/admin/inquiries" },
  { title: "A02 의뢰 진행", detail: "의뢰를 견적, 디자인, 시공 단계로 옮겨 보세요.", path: "/admin/projects" },
  { title: "A04 계약", detail: "계약완료로 바꾸면 입금 예정이 자동으로 생겨요.", path: "/admin/contracts" },
  { title: "A07 입금", detail: "입금 확인 처리를 해 보세요.", path: "/admin/payments" },
  { title: "A10 시공사례", detail: "시공사례를 올리고 홈페이지에 반영되는지 확인하세요.", path: "/admin/content" },
];

/** 관리자 화면은 로그인 후 이동하도록 로그인 화면을 거쳐 연결한다. */
export function featureHref(f: { path: string }): string {
  return f.path.startsWith("/admin") ? `/admin/login?next=${encodeURIComponent(f.path)}` : f.path;
}
