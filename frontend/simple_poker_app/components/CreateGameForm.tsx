// components/CreateGameForm.tsx
"use client";
import * as anchor from "@coral-xyz/anchor";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gamesAtom, gamesIsLoadingAtom, gamesErrorAtom } from "@/store/gameState";
import { useSetAtom } from "jotai";
import { useProgram, CreateGame} from "@/lib/AnchorClient";
import { toast } from "sonner"
export function CreateGameForm() {
    const [stakeAmount, setStakeAmount] = useState(0.1);
    const [maxPlayers, setMaxPlayers] = useState(2);

    // const isLoading = useAtomValue(gamesIsLoadingAtom);
    const setGames = useSetAtom(gamesAtom);
    const setGamesIsLoading = useSetAtom(gamesIsLoadingAtom);
    const setGamesError = useSetAtom(gamesErrorAtom);

    const program = useProgram();

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !stakeAmount || !maxPlayers) {
            console.error("Program not loaded or inputs are missing.");
            // Show a simple error toast for validation failures
            toast.error("Please ensure all fields are filled correctly.");
            return;
        }
        
        const toastId = toast.loading("Submitting transaction to create game...");

        if (!program || !stakeAmount || !maxPlayers){
            console.error("Program not loaded or inputs are missing.");
            return;
        }

        setGamesIsLoading(true);
        setGamesError(null);

        try {
            const stakeInLamports = new anchor.BN(stakeAmount * anchor.web3.LAMPORTS_PER_SOL);
            const newGame = await CreateGame(program, stakeInLamports, maxPlayers);
            
            if(typeof newGame === "object"){
                toast.success("Game created successfully!", {
                id: toastId,
                description: `Game ID: ${newGame.id.toString()}`, // Example description
            });
                setGames((CurrentGames) => [...CurrentGames, newGame]);
                setStakeAmount(0.1);
                setMaxPlayers(4);
            } else if(typeof newGame === "number") {
                toast.error("Wait for existing game to complete before creating a new one.", {
                    id: toastId,
                    description: `Game ID: ${newGame.toString()}`
                });
                setGamesError("Game could not be created.");
            }
        } catch (err) {
                console.error("Failed to create game", err);
                toast.error("Failed to create the game. Please try again.", {
                    id: toastId,
                });
                setGamesError("Failed to create the game. See console for details.");
        } finally {
            setGamesIsLoading(false);
        }
    };

    return (
    <Card className="w-full max-w-sm">
        <CardHeader>
        <CardTitle>Create Game</CardTitle>
        <CardDescription>
        Enter the game details
        </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreateGame}>
            <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                <Label htmlFor="stake_amount">Stake Amount (SOL)</Label>
                <Input
                    id="stake_amount"
                    type="number"
                    // placeholder="0.1"
                    required
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                />
                </div>

                <div className="grid gap-2">
                <Label htmlFor="max_players">Max Players</Label>
                <Input
                    id="max_players"
                    type="number"
                    // placeholder="2"
                    required
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                />
                </div>
            </div>
            </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" onClick={handleCreateGame}>
            Create
            </Button>
        </CardFooter>
    </Card>
    )
}