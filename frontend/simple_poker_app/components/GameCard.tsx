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
import { Badge } from "@/components/ui/badge";
interface GameCardProps {
  game: Game;
}

const truncateAddress = (address: string) => {
  if (address == "N/A") return "N/A";
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

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

  const statusVariantMap: {
    [key: string]: "default" | "secondary" | "destructive" | "outline";
  } = {
    open: "default",
    inProgress: "secondary",
    closed: "outline",
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Game #{game.id.toString()}</CardTitle>
          <CardDescription className="mt-2">
            Prize Pool: {game.prizePool.toFixed(2)} SOL
          </CardDescription>
        </div>
        <Badge variant={statusVariantMap[game.status] || "outline"}>
          {game.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p className="text-muted-foreground">Stake</p>
          <p className="text-right font-medium">
            {game.stakingAmount.toFixed(2)} SOL
          </p>

          <p className="text-muted-foreground">Players</p>
          <p className="text-right font-medium">
            {game.currentPlayers} / {game.maxPlayers}
          </p>

          {game.winner && (
            <>
              <p className="text-muted-foreground">Winner</p>
              <p className="truncate text-right font-medium" title={game.winner}>
                {truncateAddress(game.winner)}
              </p>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="min-h-[56px] pt-4">
        {game.status === "open" && (
          <Button
            className="w-full"
            onClick={handleJoinGame}
            disabled={!!isGameFull || !!isUserInGame}
          >
            {isGameFull ? "Game Full" : isUserInGame ? "Joined" : "Join Game"}
          </Button>
        )}

        {game.status === "inProgress" && isUserInGame && (
          <Button className="w-full" onClick={handleRoll}>
            Roll for Winner
          </Button>
        )}

        {game.status === "closed" &&(
          <Button
            className="w-full"
            onClick={handleClaim}
            disabled={game.isClaimed || !isWinner}
          >
            {isWinner ? game.isClaimed ? "Claimed" : "Claim Prize" : "Better Luck Next Time"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}