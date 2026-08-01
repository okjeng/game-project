import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import GameGrid from "./components/GameGrid";
import FamilyLeaderboard from "./components/FamilyLeaderboard";
import NameModal from "./components/NameModal";
import BlockBlastGame from "./games/blockBlast/BlockBlastGame";
import GateShooterGame from "./games/gateShooter/GateShooterGame";
import RhythmGame from "./games/rhythmGame/RhythmGame";
import BubblePopGame from "./games/bubblePop/BubblePopGame";
import { GAMES } from "./data/games";
import {
  fetchFamilyRanking,
  getFamilyRanking,
  getMyBestScore,
  getPlayerName,
  setPlayerName,
  type RankingEntry,
} from "./lib/storage";

type View = { screen: "home" } | { screen: "game"; gameId: string };

function App() {
  const [view, setView] = useState<View>({ screen: "home" });
  const [playerName, setPlayerNameState] = useState<string | null>(() => getPlayerName());
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rankingVersion, setRankingVersion] = useState(0);
  const activeGames = useMemo(() => GAMES.filter((g) => g.status === "active"), []);
  const [rankingByGame, setRankingByGame] = useState<Record<string, RankingEntry[]>>(() =>
    Object.fromEntries(activeGames.map((g) => [g.id, getFamilyRanking(g.id)]))
  );

  const blockBlast = GAMES.find((g) => g.id === "block-blast")!;
  const bestScore = useMemo(() => getMyBestScore("block-blast"), [rankingByGame]);

  useEffect(() => {
    if (view.screen !== "home") return;
    // 로컬 캐시로 즉시 표시
    setRankingByGame(Object.fromEntries(activeGames.map((g) => [g.id, getFamilyRanking(g.id)])));
    let cancelled = false;
    activeGames.forEach((g) => {
      fetchFamilyRanking(g.id).then((server) => {
        if (!cancelled) setRankingByGame((prev) => ({ ...prev, [g.id]: server })); // 서버(D1) 값이 오면 최신 순위로 갱신
      });
    });
    return () => {
      cancelled = true;
    };
  }, [view.screen, rankingVersion, activeGames]);

  const startGame = (gameId: string) => {
    if (!playerName) {
      setPendingGameId(gameId);
      return;
    }
    setView({ screen: "game", gameId });
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setPlayerNameState(name);
    if (pendingGameId) {
      setView({ screen: "game", gameId: pendingGameId });
      setPendingGameId(null);
    }
  };

  const scrollToFamily = () => {
    document.getElementById("family-record")?.scrollIntoView({ behavior: "smooth" });
  };

  const exitGame = () => {
    setRankingVersion((v) => v + 1);
    setView({ screen: "home" });
  };

  if (view.screen === "game" && playerName) {
    if (view.gameId === "block-blast") {
      return <BlockBlastGame playerName={playerName} onExit={exitGame} />;
    }
    if (view.gameId === "gate-shooter") {
      return <GateShooterGame playerName={playerName} onExit={exitGame} />;
    }
    if (view.gameId === "rhythm-game") {
      return <RhythmGame playerName={playerName} onExit={exitGame} />;
    }
    if (view.gameId === "bubble-pop") {
      return <BubblePopGame playerName={playerName} onExit={exitGame} />;
    }
  }

  return (
    <>
      <Header query={query} onQueryChange={setQuery} onFamilyClick={scrollToFamily} />
      <Hero game={blockBlast} bestScore={bestScore} onPlay={() => startGame("block-blast")} />
      <GameGrid query={query} onPlay={startGame} />
      <FamilyLeaderboard games={activeGames} rankingByGame={rankingByGame} />

      {pendingGameId && (
        <NameModal onSubmit={handleNameSubmit} onCancel={() => setPendingGameId(null)} />
      )}
    </>
  );
}

export default App;
