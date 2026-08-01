import { createPortal } from "react-dom";
import "./InstallGuide.css";

type Platform = "androidChrome" | "androidOther" | "ios" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) {
    return /chrome|crios|samsungbrowser|edg/.test(ua) ? "androidChrome" : "androidOther";
  }
  return "desktop";
}

const STEPS: { key: Platform; title: string; lines: string[] }[] = [
  {
    key: "desktop",
    title: "💻 PC (Chrome / Edge)",
    lines: ["주소창 오른쪽의 설치 아이콘(⊕)을 클릭하세요.", "안 보이면 브라우저 메뉴(⋮) → \"앱 설치\"를 확인해보세요."],
  },
  {
    key: "androidChrome",
    title: "📱 안드로이드 (Chrome / 삼성 인터넷)",
    lines: ["브라우저 메뉴(⋮)를 누르세요.", "\"앱 설치\" 또는 \"홈 화면에 추가\"를 선택하세요."],
  },
  {
    key: "androidOther",
    title: "📱 안드로이드 (기본 브라우저 등)",
    lines: [
      "브라우저 메뉴(≡ 또는 ⋮)를 누르세요.",
      "\"홈 화면에 추가\" 또는 \"바로가기 추가\"를 찾아 눌러주세요 (브라우저마다 이름이 달라요).",
      "이 메뉴 자체가 없다면, 태블릿에 Chrome 브라우저를 설치한 뒤 그걸로 다시 접속해주세요.",
    ],
  },
  {
    key: "ios",
    title: "🍎 아이폰 / 아이패드 (Safari)",
    lines: ["하단 공유 버튼(⬆️)을 누르세요.", "\"홈 화면에 추가\"를 선택하세요."],
  },
];

export default function InstallGuide({ onClose }: { onClose: () => void }) {
  const current = detectPlatform();

  return createPortal(
    <div className="ig-backdrop" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="ig-title">📲 앱으로 설치하기</h2>
        <p className="ig-subtitle">브라우저마다 방법이 조금씩 달라요. 사용 중인 기기를 확인하세요.</p>

        <div className="ig-steps">
          {STEPS.map((s) => (
            <div key={s.key} className={"ig-step" + (s.key === current ? " ig-step-current" : "")}>
              <div className="ig-step-title">
                {s.title}
                {s.key === current && <span className="ig-step-badge">지금 이 기기</span>}
              </div>
              <ol className="ig-step-lines">
                {s.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <button className="ig-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body
  );
}
