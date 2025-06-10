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
import { useAtomValue, useSetAtom } from "jotai";
import { useProgram, CreateGame} from "@/lib/AnchorClient";

export function CreateGameForm() {
    const [stakeAmount, setStakeAmount] = useState(0.1);
    const [maxPlayers, setMaxPlayers] = useState(2);
    const [description, setDescription] = useState("");

    // const isLoading = useAtomValue(gamesIsLoadingAtom);
    const setGames = useSetAtom(gamesAtom);
    const setIsLoading = useSetAtom(gamesIsLoadingAtom);
    const setError = useSetAtom(gamesErrorAtom);

    const program = useProgram();

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!program || !stakeAmount || !maxPlayers){
            console.error("Program not loaded or inputs are missing.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const stakeInLamports = new anchor.BN(stakeAmount * anchor.web3.LAMPORTS_PER_SOL);
            const newGame = await CreateGame(program, stakeInLamports, maxPlayers, description);

            if(newGame){
                setGames((CurrentGames) => [...CurrentGames, newGame]);
                setStakeAmount(0.1);
                setMaxPlayers(4);
                setDescription("");
            } else {
                setError("Game could not be created.");
            }
        } catch (err) {
                console.error("Failed to create game", err);
                setError("Failed to create the game. See console for details.");
        } finally {
            setIsLoading(false);
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
                    placeholder="0.1"
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
                    placeholder="2"
                    required
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                />
                </div>

                {/* <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    type="text"
                    placeholder="Sample Game"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                </div> */}
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