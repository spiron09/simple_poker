// app/page.tsx
"use client";
// import {AnchorProvider, Wallet} from "@coral-xyz/anchor"
// import {Keypair} from "@solana/web3.js" 
// import {useEffect} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CreateGameForm } from "@/components/CreateGameForm";
import { GameList } from "@/components/GameList";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import {initLobby, isLobbyInitialized, useProgram} from "@/lib/AnchorClient";
import { useEffect } from "react";
import { lobbyInitAtom, lobbyIsLoadingAtom } from "@/store/gameState";
import { useAtom } from "jotai";
import { toast } from "sonner";
export default function Home() {
  const { connected } = useWallet();
  const program = useProgram();
  const [lobbyInitialized, setLobbyInitialized] = useAtom(lobbyInitAtom);
  const [lobbyLoading, setLobbyLoading] = useAtom(lobbyIsLoadingAtom);

  useEffect(() => {
    const fetchLobbyState = async () => {
      if (program) {
        try {
          setLobbyLoading(true);
          const isInitialized = await isLobbyInitialized(program);
          setLobbyInitialized(isInitialized);

          toast.info("Lobby status checked.", {
          description: isInitialized
            ? "Lobby is ready."
            : "Lobby needs initialization.",
        });
        } catch (error) {
          console.error("Error fetching lobby state:", error);
          toast.error("Failed to fetch lobby state.");
        } finally {
          setLobbyLoading(false);
        }
      }
    };
    fetchLobbyState();
  }, [program, setLobbyInitialized, setLobbyLoading]);
  
  const handleInitLobby = async () => {
    if (!program) {
      console.error("Program not loaded");
      toast.error("Cannot initialize lobby. Program not available.");
      return;
    }
    const toastId = toast.loading("Initializing the lobby...");
    try {
      setLobbyLoading(true);
      const initialized = await initLobby(program);
      toast.success("Lobby initialized successfully!", { id: toastId });
      setLobbyInitialized(initialized);
    } catch (error) {
      console.error("Error initializing lobby:", error);
      toast.error("Failed to initialize lobby. Please try again.", {
      id: toastId,
    });
    } finally {
      setLobbyLoading(false);
    }
  };
  return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Simple Poker</h1>
          <div className="flex items-center gap-x-4">
            {connected &&
              program &&
              (lobbyLoading ? (
                <Badge variant="secondary">Checking Lobby...</Badge>
              ) : lobbyInitialized ? (
                <Badge variant="secondary">Lobby Ready</Badge>
              ) : (
                <button
                  onClick={handleInitLobby}
                  className="text-sm text-primary hover:underline"
                >
                  Initialize Lobby
                </button>
              ))}

            <WalletMultiButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center p-4 pt-12">
          {connected ? (
            program ? (
              <Tabs defaultValue="join-game" className="w-full max-w-4xl">
                <TabsList className="grid w-full grid-cols-2 bg-card">
                  <TabsTrigger value="join-game">Join Game</TabsTrigger>
                  <TabsTrigger value="create-game">Create Game</TabsTrigger>
                </TabsList>
                <TabsContent value="join-game" className="mt-6">
                  <GameList />
                </TabsContent>
                <TabsContent value="create-game" className="mt-6">
                  <div className="flex justify-center">
                    <CreateGameForm />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div>Initializing Program...</div>
            )
          ) : (

            <div className="text-center">
              <h2 className="text-3xl font-bold">Welcome to Simple Poker</h2>
              <p className="mt-2 text-lg text-muted-foreground">
                This game has been deployed on the devnet, please import your devnet wallets with SOL to play.
                Connect your wallet to join or create a game.
              </p>
            </div>
          )}
        </main>
      </div>
  );
}