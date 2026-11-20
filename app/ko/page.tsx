import { LangLanding, type LangCopy } from "@/lib/i18n-pages";
export const metadata = { title: "LA 한인 업소를 위한 구글 마케팅 | Lokly", description: "LA 한인타운 식당, 카페, 미용실, 업소를 위한 구글 비즈니스 프로필 관리, 리뷰, 웹사이트. 무료 구글 리포트와 무료 디지털 메뉴.",
  alternates: { canonical: "https://lokly.pro/ko", languages: { en: "https://lokly.pro", es: "https://lokly.pro/es", ko: "https://lokly.pro/ko" } } };
const c: LangCopy = { lang: "ko",
  title: "구글에서 더 많은 손님을.",
  lead: "Lokly는 구글 비즈니스 프로필 관리, 웹사이트 제작, 5점 리뷰 늘리기를 한 번에 해드립니다. LA 한인타운과 다운타운의 식당, 카페, 바, 미용실, 업소를 위한 서비스입니다.",
  cta: "무료 리포트 받기", note: "1분이면 무료 리포트가 나옵니다. 가입 필요 없음.",
  whatH: "저희가 해드리는 일",
  what: [["구글 프로필 관리", "매주 게시물, 새 사진, 정확한 영업시간. 구글 지도에서 더 잘 보이게 최적화합니다."],
    ["리뷰 늘리기", "NFC 리뷰 카드: 손님이 휴대폰을 대기만 하면 바로 구글 리뷰를 남길 수 있습니다."],
    ["웹사이트", "모바일에 빠른 웹사이트. 메뉴, 전화 버튼, 길찾기 포함."],
    ["SNS 게시물", "인스타그램, 페이스북, 틱톡 게시물을 사장님 사진과 이벤트로 만들어 드립니다."],
    ["휴대폰으로 결과 확인", "구글 조회수, 전화, 길찾기 요청을 앱에서 바로 확인하세요."]],
  menuH: "식당을 위한 무료 디지털 메뉴", menuP: "로고, 가격, 오늘의 스페셜, 테이블용 QR 코드까지. 메뉴를 무료로 온라인에 올리고 휴대폰으로 언제든 수정하세요.", menuCta: "무료 메뉴 만들기",
  priceH: "간단한 가격, 약정 없음",
  prices: [["월 $25", "구글 프로필 관리"], ["$299", "웹사이트 + 3개월 무료 관리"], ["월 $99", "Lokly Pro: 모든 서비스"]],
  proofH: "실제 결과",
  proof: ["다운타운 LA 식당: 6개월간 구글 조회수 38% 증가", "DTLA 바버샵: 구글에서 걸려온 전화 53% 증가", "가족 운영 피자집: 웹사이트 클릭 5회 → 124회"],
  contactH: "상담하기", contactP: "(323) 332-0577로 전화나 문자, 또는 hello@lokly.pro로 연락 주세요. LA 다운타운에 있습니다." };
export default function Ko() { return <LangLanding c={c} />; }
