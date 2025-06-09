"use client";

import { useAtom } from "jotai";
import { gamesAtom, errorAtom, isLoadingAtom } from "@/store/gameState";
import { GameCard } from "@/components/GameCard";
import { useProgram } from "@/lib/AnchorClient";
import { useEffect } from "react";
import { fetchAllGames } from "@/lib/AnchorClient";

export function GameList() {

  const [games, setGames] = useAtom(gamesAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [error, setError] = useAtom(errorAtom);

  
  const program = useProgram();
  useEffect(() => {
    const loadGames = async () => {
      if (!program){
        console.log("Program not loaded");
        return;
      }
      setIsLoading(true);
      setError(null);
      
      try {
        const fetchedGames = await fetchAllGames(program);
        console.log("Fetched games:", fetchedGames);
        if(!fetchedGames){
          setError("Could not fetch games.");
          return;
        }
        setGames(fetchedGames || []);
      } catch (error) {
        setError("Could not fetch games.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadGames();
  }, [program]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}