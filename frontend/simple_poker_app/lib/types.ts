export type Game = {
    id: number;
    description: string;
    stakingAmount: number;
    maxPlayers: number;
    currentPlayers: number;
    prizePool: number;
    winner: string | "N/A";
    status: string;
    players: string[];
    isClaimed: boolean;
};