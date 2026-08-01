import "./RhythmLobby.css";

const STARS = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  size: 1 + ((i * 7) % 3),
  delay: `${(i % 6) * 0.5}s`,
  duration: `${2.5 + (i % 4)}s`,
}));

const EQ_BARS = Array.from({ length: 14 }, (_, i) => ({
  delay: `${(i % 7) * 0.09}s`,
  duration: `${0.5 + (i % 5) * 0.08}s`,
}));

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  primary?: boolean;
  onClick: () => void;
};

export default function RhythmLobby({
  best,
  onPlay,
  onSongSelect,
  onCharacter,
  onCollection,
  onSettings,
}: {
  best: number;
  onPlay: () => void;
  onSongSelect: () => void;
  onCharacter: () => void;
  onCollection: () => void;
  onSettings: () => void;
}) {
  const menu: MenuItem[] = [
    { key: "play", icon: "▶", label: "PLAY", primary: true, onClick: onPlay },
    { key: "song", icon: "🎵", label: "SONG SELECT", onClick: onSongSelect },
    { key: "character", icon: "🐾", label: "CHARACTER", onClick: onCharacter },
    { key: "collection", icon: "🎁", label: "COLLECTION", onClick: onCollection },
    { key: "settings", icon: "⚙️", label: "SETTINGS", onClick: onSettings },
  ];

  return (
    <div className="rl-lobby">
      <div className="rl-bg">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="rl-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
        <div className="rl-glow rl-glow-a" />
        <div className="rl-glow rl-glow-b" />
        <div className="rl-glow rl-glow-c" />
      </div>

      <div className="rl-content">
        <p className="rl-kicker">RHYTHM GAME</p>
        <h1 className="rl-title">BEAT MATCH</h1>

        <div className="rl-mascot" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="rl-mascot-svg">
            <g className="rl-mascot-arm rl-mascot-arm-l">
              <ellipse cx="30" cy="72" rx="9" ry="16" fill="var(--neon-violet)" />
            </g>
            <g className="rl-mascot-arm rl-mascot-arm-r">
              <ellipse cx="90" cy="72" rx="9" ry="16" fill="var(--neon-violet)" />
            </g>
            <g className="rl-mascot-body">
              <ellipse cx="60" cy="66" rx="34" ry="30" fill="#ede6ff" />
              <path d="M35 44 Q42 18 55 40 Z" fill="#ede6ff" />
              <path d="M85 44 Q78 18 65 40 Z" fill="#ede6ff" />
              <path d="M40 46 Q45 26 55 41 Z" fill="var(--neon-violet)" />
              <path d="M80 46 Q75 26 65 41 Z" fill="var(--neon-violet)" />
              <g className="rl-mascot-eyes">
                <ellipse cx="48" cy="62" rx="4.5" ry="6" fill="#232328" />
                <ellipse cx="72" cy="62" rx="4.5" ry="6" fill="#232328" />
              </g>
              <path d="M53 76 Q60 82 67 76" stroke="#232328" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="40" cy="72" rx="4" ry="2.5" fill="var(--neon-coral)" opacity="0.6" />
              <ellipse cx="80" cy="72" rx="4" ry="2.5" fill="var(--neon-coral)" opacity="0.6" />
            </g>
          </svg>
        </div>

        <div className="rl-eq" aria-hidden="true">
          {EQ_BARS.map((b, i) => (
            <span key={i} className="rl-eq-bar" style={{ animationDelay: b.delay, animationDuration: b.duration }} />
          ))}
        </div>

        <nav className="rl-menu">
          {menu.map((item) => (
            <button
              key={item.key}
              className={`rl-menu-btn${item.primary ? " rl-menu-btn-primary" : ""}`}
              onClick={item.onClick}
            >
              <span className="rl-menu-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <p className="rl-best">🏆 최고 기록 {best > 0 ? best.toLocaleString() : "-"}</p>
        <p className="rl-hint">PC: D F J K &nbsp;·&nbsp; 모바일: 화면 4칸 탭</p>
      </div>
    </div>
  );
}
