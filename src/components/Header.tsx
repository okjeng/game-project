import { useState } from "react";
import "./Header.css";

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
        </div>
      </div>
    </header>
  );
}
