"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Game } from "@/lib/types";
import { useProgram, JoinGame, DetermineWinner, ClaimWinnings } from "@/lib/AnchorClient";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { gamesAtom, isLoadingAtom, errorAtom } from "@/store/gameState";
interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const program = useProgram();

  const updateGameState = (updatedGame: Game) => {
    setGames((currentGames) =>
      currentGames.map((g) =>
        g.id === updatedGame.id ? updatedGame : g
      )
    );
  }
  const [games, setGames] = useAtom(gamesAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const setError = useSetAtom(errorAtom);

  const handleJoinGame = async () => {
    console.log(game.id)
    if (!program) {
      console.error("Program not loaded");
      setError("Program not loaded ");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await JoinGame(program);
      if (updatedGame) {
        updateGameState(updatedGame);
      } else {
        setError("Failed to join game");
      }
    } catch (err) {
      console.error(err);
      setError("Error joining game. See console.");
    } finally{
      setIsLoading(false);
    }
  };
  const handleRoll = async () => {
    if (!program) {
      setError("Program not loaded ");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await DetermineWinner(program);
      if (updatedGame) {
        updateGameState(updatedGame);
      } else {
        setError("Failed to determine winner.");
      }
    } catch (err) {
      console.error(err);
      setError("Error determining winner. See console.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleClaim = async () => {
    if (!program) {
      setError("Program not loaded ");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await ClaimWinnings(program);
      if (updatedGame) {
        updateGameState(updatedGame);
      } else {
        setError("Failed to claim prize.");
      }
    } catch (err) {
      console.error(err);
      setError("Error claiming prize. See console.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{game.description}</CardTitle>
        <CardDescription>
          Game Id: {game.id}
          <br />
          Stake Amount: {game.stakingAmount.toFixed(2)} SOL
          <br />
          Prize Pool: {game.prizePool.toFixed(2)} SOL
          <br />
          Status: {game.status}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Players: {game.currentPlayers} / {game.maxPlayers}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={handleJoinGame}>
          Join Game
        </Button>
        <Button className="w-full" onClick={handleRoll}>
          Roll
        </Button>
        <Button className="w-full" onClick={handleClaim}>
          Claim
        </Button>
      </CardFooter>
    </Card>
  );
}