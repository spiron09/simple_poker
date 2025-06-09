export type Game = {
    id: string;
    description: string;
    stakingAmount: number;
    maxPlayers: number;
    currentPlayers: number;
    prizePool: number;
    status: string;
};