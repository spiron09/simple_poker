// components/CreateGameForm.tsx
"use client";

import { useState } from "react";
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

export function CreateGameForm() {
    const [stakeAmount, setStakeAmount] = useState("");
    const [maxPlayers, setMaxPlayers] = useState("");
    const [description, setDescription] = useState("");

    const handleCreateGame = async () => {

    console.log("Creating game with:", {
        stakeAmount,
        maxPlayers,
        description,
    });

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
        <form>
        <div className="flex flex-col gap-6">
            <div className="grid gap-2">
            <Label htmlFor="stake_amount">Stake Amount (SOL)</Label>
            <Input
                id="stake_amount"
                type="number"
                placeholder="0.1"
                required
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
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
                onChange={(e) => setMaxPlayers(e.target.value)}
            />
            </div>

            <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
                id="description"
                type="text"
                placeholder="Sample Game"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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