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
import {Button} from "@/components/ui/button";
import {initLobby, useProgram} from "@/lib/AnchorClient";
import { RecoilRoot } from "recoil";

export default function Home() {
  const { connected } = useWallet();
  const program = useProgram();
  return (
    <RecoilRoot>
      <div className="flex min-h-screen flex-col bg-gray-900 text-white">
        <header className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Simple Poker</h1>
          <div className="flex items-center gap-x-4">
            {connected && program && (
              <Button onClick={() => initLobby(program)}>
                Initialize Lobby
              </Button>
            )}
            <WalletMultiButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center p-4 pt-12">
          {connected ? (
            program ? (
              <Tabs defaultValue="join-game" className="w-full max-w-4xl">
                <TabsList className="grid w-full grid-cols-2">
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
              <p className="mt-2 text-lg text-gray-400">
                Connect your wallet to join or create a game.
              </p>
            </div>
          )}
        </main>
      </div>
    </RecoilRoot>
  );
}