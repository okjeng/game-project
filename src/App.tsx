import { useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import GameGrid from "./components/GameGrid";
import FamilyLeaderboard from "./components/FamilyLeaderboard";
import NameModal from "./components/NameModal";
import BlockBlastGame from "./games/blockBlast/BlockBlastGame";
import { GAMES } from "./data/games";
import { getFamilyRanking, getMyBestScore, getPlayerName, setPlayerName } from "./lib/storage";

type View = { screen: "home" } | { screen: "game"; gameId: string };

function App() {
  const [view, setView] = useState<View>({ screen: "home" });
  const [playerName, setPlayerNameState] = useState<string | null>(() => getPlayerName());
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rankingVersion, setRankingVersion] = useState(0);

  const blockBlast = GAMES.find((g) => g.id === "block-blast")!;
  const bestScore = useMemo(() => getMyBestScore("block-blast"), [view, rankingVersion]);
  const ranking = useMemo(() => getFamilyRanking("block-blast"), [view, rankingVersion]);

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

  if (view.screen === "game" && view.gameId === "block-blast" && playerName) {
    return <BlockBlastGame playerName={playerName} onExit={exitGame} />;
  }

  return (
    <>
      <Header query={query} onQueryChange={setQuery} onFamilyClick={scrollToFamily} />
      <Hero game={blockBlast} bestScore={bestScore} onPlay={() => startGame("block-blast")} />
      <GameGrid query={query} onPlay={startGame} />
      <FamilyLeaderboard ranking={ranking} />

      {pendingGameId && (
        <NameModal onSubmit={handleNameSubmit} onCancel={() => setPendingGameId(null)} />
      )}
    </>
  );
}

export default App;
