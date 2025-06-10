// lib/anchor-client.ts
import * as anchor from "@coral-xyz/anchor";
import {
    useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import {
    PublicKey,
    Connection,
} from "@solana/web3.js";
import { type SimplePoker } from "./simple_poker";
import idl from "./simple_poker.json";
import { type Game } from "@/lib/types";
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

export function useProgram() {
    const wallet = useAnchorWallet();

    const programWithSigner = useMemo(() => {
        if (!wallet) return null;

        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
        return new anchor.Program<SimplePoker>(idl as SimplePoker, provider);

    }, [wallet]);

    return programWithSigner;
}

export async function initLobby(
    program: anchor.Program<SimplePoker>,
): Promise<boolean> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }
    const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountInfo = await program.account.gameLobby.getAccountInfo(lobbyPDA);

    if (lobbyAccountInfo) {
        console.log("Game lobby already initialized. Skipping creation.");
        return true;
    }
    console.log("Lobby account not found. Initializing game lobby...")
    try {
        const tx_signature = await program.methods
            .initGameLobby()
            .accounts({
                lobbyCreator: provider.wallet.publicKey,
            })
            .rpc();
        console.log(
            "Game lobby initialized successfully!",
            `Tx: ${tx_signature}`
        );
        return true;
    } catch (error) {
        console.error("Failed to initialize game lobby:", error);
        return false;
    }
}

export async function isLobbyInitialized(program: anchor.Program<SimplePoker>): Promise<boolean> {

    if (!program) {
        throw new Error("Program is not configured.");
    }

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountInfo = await program.account.gameLobby.getAccountInfo(lobbyPDA);

    if (lobbyAccountInfo) {
        return true;
    }
    return false;
}

export async function CreateGame(
    program: anchor.Program<SimplePoker>,
    stakeAmount: anchor.BN,
    maxPlayers: number,
): Promise<Game> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }

    const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );
    const lobbyAccountData = await program.account.gameLobby.fetch(lobbyPDA);
    const current_game_id = lobbyAccountData.currentGameId;

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), current_game_id.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );
    
    const gameAccountData = await program.account.game.fetch(gamePDA);
    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    if (gameAccountInfo) {
        console.log("Game already initialized. Please Join the game or wait for it to complete");
        return gameAccountData;
    }

    try {
        const tx_signature = await program.methods
            .createGame(stakeAmount, maxPlayers)
            .accounts({
                gameCreator: provider.wallet.publicKey,
            })
            .rpc();
        const gameAccountData = await program.account.game.fetch(gamePDA);
        console.log(
            "Game Created successfully!",
            `Game ID: ${gameAccountData.id}`,
            `Tx: ${tx_signature}`
        );

        const createdGame: Game = mapOnChainDataToGame(gameAccountData);

        return createdGame;

    } catch (error) {
        console.error("Failed create game", error);
        throw error;
    }
}

export async function JoinGame(
    program: anchor.Program<SimplePoker>,
    gameId: anchor.BN,
): Promise<Game | null> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }

    const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountData = await program.account.gameLobby.fetch(lobbyPDA);

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), gameId.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );
    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), gameId.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );

    console.log("Current game ID:", Number(lobbyAccountData.currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return null;
    }

    try {
        const tx_signature = await program.methods
            .joinGame()
            .accounts({
                player: provider.wallet.publicKey,
            })
            .rpc();
        const gameAccountData = await program.account.game.fetch(gamePDA);
        //UpdateState of the game
        console.log(
            "Joined Game Sucessfully!",
            `User: ${provider.wallet.publicKey.toBase58()}`,
            `Game ID: ${gameAccountData.id}`,
            `Tx: ${tx_signature}`
        );
        return mapOnChainDataToGame(gameAccountData);
    } catch (error) {
        console.error("Failed create game", error);
        return null
    }
}

export async function DetermineWinner(
    program: anchor.Program<SimplePoker>,
    gameId: anchor.BN,
): Promise<Game | null> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }
    // const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountData = await program.account.gameLobby.fetch(lobbyPDA);

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)],
        program.programId,
    );

    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), gameId.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );

    console.log("Current game ID:", Number(lobbyAccountData.currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return null;
    }

    try {
        const tx_signature = await program.methods
            .determineWinner()
            .accounts({
                gameAccount: gamePDA,
            })
            .rpc();
        const gameAccountData = await program.account.game.fetch(gamePDA);
        console.log(
            "Winner Rolled",
            `Winner: ${gameAccountData.winner}`,
            `Game ID: ${gameAccountData.id}`,
            `Amount Won: ${gameAccountData.prizePool}`,
            `Tx: ${tx_signature}`
        );
        return mapOnChainDataToGame(gameAccountData);
    } catch (error) {
        console.error("Failed create game", error);
        return null;
    }
}

export async function ClaimWinnings(
    program: anchor.Program<SimplePoker>,
    gameId: anchor.BN,
): Promise<Game | null> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }

    const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountData = await program.account.gameLobby.fetch(lobbyPDA);

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), gameId.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );

    const gameAccountData = await program.account.game.fetch(gamePDA);
    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), gameId.toArrayLike(Buffer, "le", 8)],
        program.programId,
    );

    console.log("Winner", gameAccountData.winner?.toBase58());
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return null;
    }
    if (gameAccountData.winner?.toBase58() == provider.wallet.publicKey.toBase58()) {
        try {
            const tx_signature = await program.methods
                .claimPrize()
                .accounts({winner: provider.wallet.publicKey})
                .rpc();
            const gameAccountData = await program.account.game.fetch(gamePDA);
            console.log(
                "Winner Rolled",
                `Winner: ${gameAccountData.winner}`,
                `Game ID: ${gameAccountData.id}`,
                `Amount Won: ${gameAccountData.prizePool}`,
                `Tx: ${tx_signature}`
            );
            return mapOnChainDataToGame(gameAccountData);
        } catch (error) {
            console.error("Failed create game", error);
            throw error;
        }
    } else {
        console.log("Only the winner can claim the prize");
        return null;
    }
}

const mapOnChainDataToGame = (account: any): Game => {
    // The prize pool is the stake amount multiplied by the number of players.
    let prizePool = account.prizePool.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    if (account.prizePool.toNumber() === 0) {
        prizePool = (account.stakeAmount.toNumber() * account.maxPlayers) / anchor.web3.LAMPORTS_PER_SOL;
    }
    const players_string: string[] = [];
    for (let i = 0; i < account.maxPlayers; i++) {
        players_string.push(account.players[i].toBase58());
    }
    return {
        id: account.id.toString(),
        description: `Game #${account.id.toString()}`,
        stakingAmount: account.stakeAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
        maxPlayers: account.maxPlayers,
        currentPlayers: account.playerCount,
        prizePool: prizePool,
        status: Object.keys(account.state)[0],
        winner: account.winner?.toBase58() || "N/A",
        players: players_string,
        isClaimed: account.isClaimed,
    };
};

export async function fetchAllGames(
    program: anchor.Program<SimplePoker>,
): Promise<Game[] | null> {
    if (!program.provider) {
        throw new Error("Provider is not configured.");
    }

    // const provider = program.provider as anchor.AnchorProvider;

    const [lobbyPDA] = PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode("game_lobby")],
        program.programId,
    );

    const lobbyAccountData = await program.account.gameLobby.fetch(lobbyPDA);
    const current_game_id = lobbyAccountData.currentGameId;


    // const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
    //     [Buffer.from("game"), new anchor.BN(lobbyAccountData.currentGameId).toArrayLike(Buffer,"le", 8)],
    //     program.programId,
    // );
    const games: Game[] = [];
    const gameAccountInfo = await program.account.game.all();
    for (let i = 0; i < gameAccountInfo.length; i++) {
        games.push(mapOnChainDataToGame(gameAccountInfo[i].account));
    }

    console.log(gameAccountInfo[0])
    console.log(`Game Account Info ${gameAccountInfo[0]}`)
    return games;


    return null;
}

