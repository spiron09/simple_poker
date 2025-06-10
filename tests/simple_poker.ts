import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimplePoker } from "../target/types/simple_poker";
import { assert, expect } from "chai";

describe("simple_poker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.simplePoker as Program<SimplePoker>;

  const lobbyCreator = anchor.web3.Keypair.generate();
  const gameCreator = lobbyCreator;
  const player1 = gameCreator;
  const player2 = anchor.web3.Keypair.generate();
  const player3 = anchor.web3.Keypair.generate();
  const player4 = anchor.web3.Keypair.generate();
  let currentGameId: anchor.BN
  const stakeAmount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
  const maxPlayers = 4;

  console.log("Player 1:", player1.publicKey.toBase58());
  console.log("Player 2:", player2.publicKey.toBase58());
  console.log("Player 3:", player3.publicKey.toBase58());
  console.log("Player 4:", player4.publicKey.toBase58());

  const [lobbyPDA, lobbyBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("game_lobby")],
    program.programId
  );

  const airdropSol = async (publicKey: anchor.web3.PublicKey, amount: number) => {
    const airdropTx = await provider.connection.requestAirdrop(
      publicKey,
      amount,
    );
    // Use confirmTransaction to wait for the airdrop to complete
    await provider.connection.confirmTransaction({
      signature: airdropTx,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await provider.connection.getLatestBlockhash()).lastValidBlockHeight
    }, "confirmed");
  };

  before(async () => {
    // Airdrop SOL to all accounts and wait for confirmation
    const solToAirdrop = 2 * anchor.web3.LAMPORTS_PER_SOL;
    await airdropSol(lobbyCreator.publicKey, solToAirdrop);
    await airdropSol(player1.publicKey, solToAirdrop);
    await airdropSol(player2.publicKey, solToAirdrop);
    await airdropSol(player3.publicKey, solToAirdrop);
    await airdropSol(player4.publicKey, solToAirdrop);
  });

  it("Game Lobby Init", async () => {
    // Add your test here.
    await program.methods
      .initGameLobby()
      .accounts({
        lobbyCreator: lobbyCreator.publicKey
      })
      .signers([lobbyCreator])
      .rpc();

    const lobbyAccount = await program.account.gameLobby.fetch(lobbyPDA);

    assert.strictEqual(Number(lobbyAccount.currentGameId), 0, "Last game ID should be 0");

  });

  it("Create Game", async () => {
    const lobbyAccount = await program.account.gameLobby.fetch(lobbyPDA);
    currentGameId = lobbyAccount.currentGameId;
    console.log("Current game ID:", Number(currentGameId));

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), currentGameId.toBuffer("le", 8)],
      program.programId,
    );

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault"), currentGameId.toBuffer("le", 8)],
      program.programId,
    );

    await program.methods
      .createGame(stakeAmount, maxPlayers)
      .accounts({
        gameCreator: player1.publicKey
      })
      .signers([player1])
      .rpc();

    const gameAccount = await program.account.game.fetch(gamePDA);

    assert.ok(
      gameAccount.creator.equals(player1.publicKey),
      "Game creator is not set correctly",
    );
    assert.strictEqual(
      Number(gameAccount.id),
      Number(currentGameId),
      "Game ID is not set correctly",
    );
    assert.ok(
      Number(gameAccount.stakeAmount) == Number(stakeAmount),
      "Stake amount is not set correctly",
    );
    assert.deepStrictEqual(
      gameAccount.state,
      { open: {} },
      "Game state should be Open",
    );
  });

  it("Allows players to join a game and starts the game", async () => {

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), new anchor.BN(currentGameId).toBuffer("le", 8)],
      program.programId,
    );

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault"), currentGameId.toBuffer("le", 8)],
      program.programId,
    );

    console.log("Current game ID:", Number(currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    // Player One joins
    await program.methods
      .joinGame()
      .accounts({
        player: player1.publicKey
      })
      .signers([player1])
      .rpc();

    let gameAccount = await program.account.game.fetch(gamePDA);
    let vaultBalance = await provider.connection.getBalance(vaultPDA);
    // console.log(`Vault Account Amount after p1 joins` + vaultAccount.amount);

    console.log("Player count:", gameAccount.playerCount);
    assert.strictEqual(
      gameAccount.playerCount,
      1,
      "Player one was not added to the game",
    );
    assert.ok(
      gameAccount.players[0].equals(player1.publicKey),
      "Player one's public key is incorrect",
    );

    // Player Two joins
    await program.methods
      .joinGame()
      .accounts({
        player: player2.publicKey
      })
      .signers([player2])
      .rpc();

    gameAccount = await program.account.game.fetch(gamePDA);
    vaultBalance = await provider.connection.getBalance(vaultPDA);

    console.log("Player count:", gameAccount.playerCount);

    assert.strictEqual(
      gameAccount.playerCount,
      2,
      "Player two was not added to the game",
    );
    assert.ok(
      gameAccount.players[1].equals(player2.publicKey),
      "Player two's public key is incorrect",
    );

    // Player Three joins
    await program.methods
      .joinGame()
      .accounts({
        player: player3.publicKey
      })
      .signers([player3])
      .rpc();

    gameAccount = await program.account.game.fetch(gamePDA);
    vaultBalance = await provider.connection.getBalance(vaultPDA);

    console.log("Player count:", gameAccount.playerCount);

    assert.strictEqual(
      gameAccount.playerCount,
      3,
      "Player three was not added to the game",
    );
    assert.ok(
      gameAccount.players[2].equals(player3.publicKey),
      "Player three's public key is incorrect",
    );

    // Player Four joins
    await program.methods
      .joinGame()
      .accounts({
        player: player4.publicKey
      })
      .signers([player4])
      .rpc();

    gameAccount = await program.account.game.fetch(gamePDA);
    vaultBalance = await provider.connection.getBalance(vaultPDA);
    
    const joinedPlayers = Array.from(gameAccount.players);
    console.log("Joined players:", joinedPlayers);
    console.log("Vault balance:", vaultBalance);
    console.log("Player count:", gameAccount.playerCount);

    assert.strictEqual(
      gameAccount.playerCount,
      4,
      "Player three was not added to the game",
    );
    assert.deepStrictEqual(
      gameAccount.state,
      { inProgress: {} },
      "Game state should be InProgress",
    );
  });

  it("Determines the winner of the game", async () => {
    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), new anchor.BN(currentGameId).toBuffer("le", 8)],
      program.programId,
    );

    console.log("Determining winner for game ID:", Number(currentGameId));
    console.log("Game PDA:", gamePDA.toBase58());

    // Verify game is in InProgress state before determining winner
    let gameAccount = await program.account.game.fetch(gamePDA);
    assert.deepStrictEqual(
      gameAccount.state,
      { inProgress: {} },
      "Game should be in InProgress state"
    );

    // Determine winner
    const tx = await program.methods
      .determineWinner()
      .accounts({
        gameAccount: gamePDA,
      })
      .rpc();

    console.log("Signature:", tx);
    // Fetch updated game account
    gameAccount = await program.account.game.fetch(gamePDA);

    // Verify game state changed to Closed
    assert.deepStrictEqual(
      gameAccount.state,
      { closed: {} },
      "Game state should be Closed after determining winner"
    );

    // Verify winner is set
    assert.ok(
      gameAccount.winner !== null,
      "Winner should be determined"
    );

    // Verify winner is one of the players
    const winnerKey = gameAccount.winner;
    const isValidWinner = gameAccount.players.some(player =>
      player.equals(winnerKey)
    );
    assert.ok(
      isValidWinner,
      "Winner should be one of the game players"
    );

    // Verify rolls were generated for all players
    assert.strictEqual(
      gameAccount.rolls.length,
      gameAccount.players.length,
      "Each player should have a roll"
    );

    // Verify all rolls are between 1 and 10
    const playerCount = gameAccount.playerCount;
    for (let i = 0; i<playerCount; i++) {
      const roll = gameAccount.rolls[i];
      expect(roll).to.be.greaterThan(0);
      expect(roll).to.be.lessThan(11);
    }

    console.log("Player rolls:", Array.from(gameAccount.rolls));
    console.log("Winner:", gameAccount.winner.toBase58());
  });

  it("Claims the prize", async () => {

    const [gamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), new anchor.BN(currentGameId).toBuffer("le", 8)],
      program.programId,
    );

    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_vault"), currentGameId.toBuffer("le", 8)],
      program.programId,
    );

    let gameAccount_data = await program.account.game.fetch(gamePDA);
    const vaultBalance = await provider.connection.getBalance(vaultPDA);

    console.log("Before Claim", gameAccount_data.isClaimed);

    console.log("Winner:", gameAccount_data.winner.toBase58());
    console.log("Vault amount:", Number(vaultBalance) / anchor.web3.LAMPORTS_PER_SOL);

    const winnerKey = gameAccount_data.winner;

    // Determine which keypair to use
    let winnerKeypair;
    if (winnerKey.equals(player1.publicKey)) {
      winnerKeypair = player1;
    } else {
      winnerKeypair = player2;
    }

    const beforeBalance = await provider.connection.getBalance(winnerKey);

    await program.methods
      .claimPrize()
      .accounts({
        winner: winnerKey,
      })
      .signers([])
      .rpc();

    const afterBalance = await provider.connection.getBalance(winnerKey);
    gameAccount_data = await program.account.game.fetch(gamePDA);
    
    console.log("Balance before:", beforeBalance / anchor.web3.LAMPORTS_PER_SOL);
    console.log("Balance after:", afterBalance / anchor.web3.LAMPORTS_PER_SOL);

    assert.ok(
      afterBalance > beforeBalance,
      "Winner should have received prize money"
    );
    console.log("After Claim", gameAccount_data.isClaimed);
    assert.ok(
      gameAccount_data.isClaimed,
      "Game should be marked as claimed"
    )
    try {
      const vaultBalance = await provider.connection.getBalance(vaultPDA);
      console.log("Vault amount after claim:", Number(vaultBalance));
    } catch (error) {
      console.log("Vault was closed (this is expected if using close = winner)");
    }

  });
});
