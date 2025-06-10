# 🃏 Simple Poker on Solana

A fully decentralized, peer-to-peer poker/dice game built on the Solana blockchain. This project uses an Anchor program for the on-chain logic and a Next.js frontend for a modern, reactive user experience.

![Simple Poker Screenshot](https://user-images.githubusercontent.com/43688683/283351899-80587158-0151-411e-872a-111111111111.png)
*(Suggestion: Replace the URL above with a link to a real screenshot of your application!)*

## 🎮 How to Play

This game is deployed on the Solana **Devnet**. To play, you will need a Solana-compatible wallet and some Devnet SOL for transaction fees and stakes.

### Player Prerequisites

1. **A Solana Wallet:** Install a browser extension wallet like [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/).
2. **Devnet SOL:** You need some "play" money to interact with the game. You can get free Devnet SOL from a faucet:
    - **Easiest Method (Web):** Go to a web faucet like [solfaucet.com](https://solfaucet.com/), select "Devnet", enter your wallet address, and request an airdrop.
    - **Developer Method (CLI):** If you have the Solana CLI installed, run the following command in your terminal:

        ```bash
        solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
        ```

### Game Walkthrough

#### 1. Connect Your Wallet

Click the **"Select Wallet"** button at the top right of the page and approve the connection in your wallet.

#### 2. Initialize the Lobby

If you are the first person to use the app after deployment, an **"Initialize Lobby"** button will appear. Click this once to set up the on-chain program. After this, the button will show "Lobby Ready".

#### 3. Join or Create a Game

You have two choices, accessible via the main tabs:

- **Join Game:** Find a game card with a green "open" status and click the "Join Game" button. This will require a transaction to stake your SOL.
- **Create Game:** Navigate to the "Create Game" tab. Enter the amount of SOL you want to stake and the maximum number of players, then click "Create".

> ### ⚠️ Important Note on Creating Games
>
> Due to the current program logic, only one game can be active at a time.
>
> A new game can only be created after the winner of the previous game has successfully clicked **"Claim Prize"**. This resets the state and allows for a new game to begin.

#### 4. Determine the Winner

Once a game is full (e.g., `2 / 2` players), its status will change to "inProgress". Any player who joined that game can then click the **"Roll for Winner"** button. This triggers the on-chain logic that randomly selects a winner from the list of players.

#### 5. Claim Your Winnings

If you are the winner, the button on the game card will change to **"Claim Prize"**. Click it to transfer the entire prize pool to your wallet. Congratulations!

If you didn't win, the button will show a "Better Luck Next Time" message.

## ✨ Features

- **Wallet Integration:** Connects with popular Solana wallets like Phantom and Solflare via the Wallet Adapter.
- **On-Chain Game Logic:** All game states (lobby, games, players, winners) are managed by an Anchor smart contract on the Solana blockchain.
- **Create & Join Games:** Users can create new games with a custom stake amount and player limit, or join existing open games.
- **Winner Determination:** A simple "roll" mechanism determines the winner once a game is full.
- **Claim Winnings:** Winners can securely claim the prize pool from the game contract.
- **Real-time State Management:** Uses [Jotai](https://jotai.org/) for efficient, global state management, ensuring the UI is always in sync.
- **Modern UI:** Built with [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), and beautifully crafted components from [shadcn/ui](https://ui.shadcn.com/).
- **User Feedback:** Integrated toast notifications with [Sonner](https://sonner.emilkowal.ski/) for a smooth user experience.

## 🛠️ Tech Stack

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) 14 (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Jotai](https://jotai.org/)
- **Wallet Connection:** [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)

### On-Chain (Backend)

- **Framework:** [Anchor](https://www.anchor-lang.com/)
- **Language:** [Rust](https://www.rust-lang.org/)
- **Blockchain:** [Solana](https://solana.com/)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
