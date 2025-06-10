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
import { toast } from "sonner";
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
    if (!program) {
      toast.error("Program not loaded. Please connect your wallet.");
      return;
    }
    const toastId = toast.loading("Submitting transaction to join game...");
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await JoinGame(program, new anchor.BN(game.id));
      if (updatedGame) {
        toast.success("Successfully joined the game!", { id: toastId });
        updateGameState(updatedGame);
      } else {
        toast.error("Failed to join game.", { id: toastId });
        setError("Failed to join game");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error joining game. Please try again.", { id: toastId });
      setError("Error joining game. See console.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRoll = async () => {
    if (!program) {
      toast.error("Program not loaded. Please connect your wallet.");
      return;
    }
    const toastId = toast.loading("Assigning Numbers to players...");
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await DetermineWinner(program, new anchor.BN(game.id));
      if (updatedGame) {
        if (program.provider.publicKey && program.provider.publicKey.toBase58() === updatedGame.winner) {
          toast.info("Congratulations! You are the winner!", {
            id: toastId,
            description: `The winner is: ${updatedGame.winner}`,
          });
        } else {
          toast.success("Winner determined!, Sorry better luck next time", {
            id: toastId,
            description: `The winner is: ${updatedGame.winner}`,
          });
        }
        updateGameState(updatedGame);
      } else {
        toast.error("Failed to determine a winner.", { id: toastId });
        setError("Failed to determine winner.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error determining winner. Please try again.", {
        id: toastId,
      });
      setError("Error determining winner. See console.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleClaim = async () => {
    if (!program) {
      toast.error("Program not loaded. Please connect your wallet.");
      return;
    }
    const toastId = toast.loading("Submitting transaction to claim prize...");
    setIsLoading(true);
    setError(null);
    try {
      const updatedGame = await ClaimWinnings(program, new anchor.BN(game.id));
      if (updatedGame) {
        toast.success("Winnings claimed successfully!", { id: toastId });
        updateGameState(updatedGame);
      } else {
        toast.error("Failed to claim prize.", { id: toastId });
        setError("Failed to claim prize.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error claiming prize. Please try again.", { id: toastId });
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
          <Button
            className="w-full"
            onClick={handleClaim}
            disabled={game.isClaimed}
          >
            {game.isClaimed ? "Claimed" : "Claim Prize"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}