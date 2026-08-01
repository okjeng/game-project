import { useEffect, useState } from "react";
import "./Header.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneDisplay(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export default function Header({
  query,
  onQueryChange,
  onFamilyClick,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onFamilyClick: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => isStandaloneDisplay());
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
      setShowInstallHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setIsStandalone(true);
      setInstallEvent(null);
      return;
    }
    setShowInstallHelp((v) => !v);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="header-logo">🎮 가족 게임방</div>
        <div className="header-actions">
          <div className={"header-search" + (searchOpen ? " header-search-open" : "")}>
            <button
              className="header-icon-btn"
              aria-label="게임 검색"
              onClick={() => setSearchOpen((v) => !v)}
            >
              🔍
            </button>
            {searchOpen && (
              <input
                autoFocus
                className="header-search-input"
                placeholder="게임 검색"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            )}
          </div>
          <button className="header-icon-btn" onClick={onFamilyClick}>
            🏆 가족 기록
          </button>
          {!isStandalone && (
            <div className="header-install">
              <button className="header-install-btn" onClick={handleInstallClick}>
                📲 앱 설치
              </button>
              {showInstallHelp && (
                <div className="header-install-help">
                  <p>
                    주소창 오른쪽의 <strong>설치 아이콘(⊕)</strong>을 눌러주세요.
                  </p>
                  <p>안 보이면 브라우저 메뉴(⋮) → "앱 설치"를 확인해보세요.</p>
                  <p className="header-install-help-note">Chrome / Edge에서 설치할 수 있어요.</p>
                  <button className="header-install-help-close" onClick={() => setShowInstallHelp(false)}>
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
