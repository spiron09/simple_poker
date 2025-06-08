import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimplePoker } from "../target/types/simple_poker";
import { assert } from "chai";

describe("simple_poker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.simplePoker as Program<SimplePoker>;

  const lobbyCreator = anchor.web3.Keypair.generate();
  const gameCreator = lobbyCreator;
  const player1 = gameCreator;
  const player2 = anchor.web3.Keypair.generate();
  let currentGameId: anchor.BN
  const stakeAmount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

  console.log("Player 1:", player1.publicKey.toBase58());
  console.log("Player 2:", player2.publicKey.toBase58());

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
    const solToAirdrop = 100 * anchor.web3.LAMPORTS_PER_SOL;
    await airdropSol(lobbyCreator.publicKey, solToAirdrop);
    await airdropSol(player1.publicKey, solToAirdrop);
    await airdropSol(player2.publicKey, solToAirdrop);
  });

  it("Initializes the game lobby", async () => {
    // Add your test here.
    await program.methods
      .initGameLobby()
      .accounts({
        lobbyCreator: lobbyCreator.publicKey
      })
      .signers([lobbyCreator])
      .rpc();

    const lobbyAccount = await program.account.gameLobby.fetch(lobbyPDA);

    assert.strictEqual(Number(lobbyAccount.lastGameId), 0, "Last game ID should be 0");

  });

  it("Creates a new game", async () => {
    const lobbyAccount = await program.account.gameLobby.fetch(lobbyPDA);
    currentGameId = lobbyAccount.lastGameId;
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
      .createGame(stakeAmount)
      .accounts({
        gameAccount: gamePDA,
        vaultAccount: vaultPDA,
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

    console.log("Current game ID:", currentGameId);
    console.log("Game PDA:", gamePDA.toBase58());
    console.log("Vault PDA:", vaultPDA.toBase58());

    // Player One joins
    await program.methods
      .joinGame(currentGameId)
      .accounts({
        player: player1.publicKey
      })
      .signers([player1])
      .rpc();

    let gameAccount = await program.account.game.fetch(gamePDA);
    let vaultBalance = await provider.connection.getBalance(vaultPDA);
    // console.log(`Vault Account Amount after p1 joins` + vaultAccount.amount);

    assert.strictEqual(
      gameAccount.players.length,
      1,
      "Player one was not added to the game",
    );
    assert.ok(
      gameAccount.players[0].equals(player1.publicKey),
      "Player one's public key is incorrect",
    );

    // Player Two joins
    await program.methods
      .joinGame(currentGameId)
      .accounts({
        player: player2.publicKey
      })
      .signers([player2])
      .rpc();

    gameAccount = await program.account.game.fetch(gamePDA);
    vaultBalance = await provider.connection.getBalance(vaultPDA);

    assert.strictEqual(
      gameAccount.players.length,
      2,
      "Player two was not added to the game",
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

    console.log("Determining winner for game ID:", currentGameId);
    console.log("Game PDA:", gamePDA.toBase58());

    // Verify game is in InProgress state before determining winner
    let gameAccount = await program.account.game.fetch(gamePDA);
    assert.deepStrictEqual(
      gameAccount.state,
      { inProgress: {} },
      "Game should be in InProgress state"
    );

    // Determine winner
    await program.methods
      .determineWinner(currentGameId)
      .accounts({
        gameAccount: gamePDA,
      })
      .rpc();

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
    gameAccount.rolls.forEach((roll, index) => {
      assert.ok(
        roll >= 1 && roll <= 10,
        `Player ${index} roll should be between 1 and 10, got ${roll}`
      );
    });

    console.log("Player rolls:", gameAccount.rolls);
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

    const gameAccount_data = await program.account.game.fetch(gamePDA);
    const vaultBalance = await provider.connection.getBalance(vaultPDA);


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
      .claimPrize(currentGameId)
      .accounts({
        lobbyAccount: lobbyPDA,
        winner: winnerKey,
      })
      .signers([winnerKeypair])
      .rpc();

    const afterBalance = await provider.connection.getBalance(winnerKey);

    console.log("Balance before:", beforeBalance / anchor.web3.LAMPORTS_PER_SOL);
    console.log("Balance after:", afterBalance / anchor.web3.LAMPORTS_PER_SOL);

    assert.ok(
      afterBalance > beforeBalance,
      "Winner should have received prize money"
    );

    try {
      const vaultBalance = await provider.connection.getBalance(vaultPDA);
      console.log("Vault amount after claim:", Number(vaultBalance));
    } catch (error) {
      console.log("Vault was closed (this is expected if using close = winner)");
    }

  });
});
