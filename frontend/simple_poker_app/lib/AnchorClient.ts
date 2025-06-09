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
import { SimplePoker } from "./simple_poker";
import idl from "./simple_poker.json";
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
) {
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
        return;
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
    } catch (error) {
        console.error("Failed to initialize game lobby:", error);
        throw error;
    }
}

export async function CreateGame(
    program: anchor.Program<SimplePoker>,
    stakeAmount: anchor.BN,
    maxPlayers: number,
) {
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
        [Buffer.from("game"), new anchor.BN(lobbyAccountData.currentGameId).toBuffer("le", 8)],
        program.programId,
    );

    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    if (gameAccountInfo) {
        console.log("Game already initialized. Please Join the game or wait for it to complete");
        return;
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
    } catch (error) {
        console.error("Failed create game", error);
        throw error;
    }
}

export async function JoinGame(
    program: anchor.Program<SimplePoker>,
) {
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
        [Buffer.from("game"), new anchor.BN(lobbyAccountData.currentGameId).toBuffer("le", 8)],
        program.programId,
    );
    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), lobbyAccountData.currentGameId.toBuffer("le", 8)],
        program.programId,
    );

    console.log("Current game ID:", Number(lobbyAccountData.currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return;
    }

    try {
        const tx_signature = await program.methods
            .joinGame()
            .accounts({
                player: provider.wallet.publicKey,
            })
            .rpc();
        const gameAccountData = await program.account.game.fetch(gamePDA);
        console.log(
            "Joined Game Sucessfully!",
            `User: ${provider.wallet.publicKey.toBase58()}`,
            `Game ID: ${gameAccountData.id}`,
            `Tx: ${tx_signature}`
        );
    } catch (error) {
        console.error("Failed create game", error);
        throw error;
    }
}

export async function DetermineWinner(
    program: anchor.Program<SimplePoker>,
) {
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
        [Buffer.from("game"), new anchor.BN(lobbyAccountData.currentGameId).toBuffer("le", 8)],
        program.programId,
    );

    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), lobbyAccountData.currentGameId.toBuffer("le", 8)],
        program.programId,
    );

    console.log("Current game ID:", Number(lobbyAccountData.currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return;
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
    } catch (error) {
        console.error("Failed create game", error);
        throw error;
    }
}

export async function ClaimWinnings(
    program: anchor.Program<SimplePoker>,
) {
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
        [Buffer.from("game"), new anchor.BN(lobbyAccountData.currentGameId).toBuffer("le", 8)],
        program.programId,
    );

    const gameAccountData = await program.account.game.fetch(gamePDA);
    const gameAccountInfo = await program.account.game.getAccountInfo(gamePDA);

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_vault"), lobbyAccountData.currentGameId.toBuffer("le", 8)],
        program.programId,
    );

    console.log("Winner",gameAccountData.winner);
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    if (!gameAccountInfo) {
        console.log("Game not created yet, please create the game first");
        return;
    }
    if(gameAccountData.winner == provider.wallet.publicKey){
        try {
            const tx_signature = await program.methods
                .claimPrize()
                .accounts({
                    winner: provider.wallet.publicKey,
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
        } catch (error) {
            console.error("Failed create game", error);
            throw error;
        }
    } else {
        console.log("Only the winner can claim the prize");
    }
}

