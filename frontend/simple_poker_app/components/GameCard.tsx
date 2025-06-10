"use client";
import * as anchor from "@coral-xyz/anchor";
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
import { useAtom, useSetAtom } from "jotai";
import { gamesAtom, gamesIsLoadingAtom, gamesErrorAtom } from "@/store/gameState";
import { useWallet } from "@solana/wallet-adapter-react";
interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const { publicKey } = useWallet();
  const userAddress = publicKey?.toBase58();

  const isUserInGame =
    userAddress && game.players.includes(userAddress);
  const isWinner = userAddress && game.winner === userAddress;
  const isGameFull = game.currentPlayers >= game.maxPlayers;


  const program = useProgram();

  const updateGameState = (updatedGame: Game) => {
    setGames((currentGames) =>
      currentGames.map((g) =>
        g.id === updatedGame.id ? updatedGame : g
      )
    );
  }
  const [games, setGames] = useAtom(gamesAtom);
  const setIsLoading = useSetAtom(gamesIsLoadingAtom);
  const setError = useSetAtom(gamesErrorAtom);

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
      const updatedGame = await JoinGame(program,new anchor.BN(game.id));
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
      const updatedGame = await DetermineWinner(program,new anchor.BN(game.id));
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
      const updatedGame = await ClaimWinnings(program,new anchor.BN(game.id));
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
          <br />
          Winner: {game.winner}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Players: {game.currentPlayers} / {game.maxPlayers}
        </p>
      </CardContent>
      <CardFooter className="min-h-[56px]">
        {game.status === "open" && !isUserInGame && (
          <Button
            className="w-full"
            onClick={handleJoinGame}
            disabled={isGameFull}
          >
            {isGameFull ? "Game Full" : "Join Game"}
          </Button>
        )}

        {game.status === "inProgress" && isUserInGame && (
          <Button className="w-full" onClick={handleRoll}>
            Roll for Winner
          </Button>
        )}

        {game.status === "closed" && isWinner && (
          <Button className="w-full" onClick={handleClaim}>
            Claim Prize
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}