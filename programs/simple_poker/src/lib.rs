use anchor_lang::prelude::*;
use anchor_lang::system_program::*;
declare_id!("ACX7FXn1jP1j1X4TNVVq4Fxw5Mot8kicwTeBh3yBno8B");
const MAX_PLAYERS: u8 = 10;

#[program]
pub mod simple_poker {
    use super::*;
    pub fn init_game_lobby(ctx: Context<InitGameLobby>) -> Result<()> {
        ctx.accounts.lobby_account.current_game_id = 0;
        Ok(())
    }

    pub fn create_game(ctx: Context<CreateGame>, stake_amount: u64, max_players: u8) -> Result<()> {

        let game_id = ctx.accounts.lobby_account.current_game_id;
        let game = &mut ctx.accounts.game_account;
        
        game.creator = ctx.accounts.game_creator.key();
        game.id = game_id;
        game.state = GameState::Open;
        game.stake_amount = stake_amount;
        game.max_players = max_players;
        game.players = [Pubkey::default(); MAX_PLAYERS as usize];
        game.rolls = [0; MAX_PLAYERS as usize];
        game.winner = None;
        game.prize_pool = stake_amount*(max_players as u64);
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {

        let game = &mut ctx.accounts.game_account;
        let player = &ctx.accounts.player;
        let vault = &mut ctx.accounts.game_vault;
        let player_index = game.player_count;

        require!(game.state == GameState::Open, GameError::GameNotOpen);
        require!(game.player_count < game.max_players, GameError::GameFull);
        
        let active_players = &game.players[..game.player_count as usize];

        require!(
            !active_players.contains(&player.key()),
            GameError::AlreadyInGame
        );
        
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: player.to_account_info(),
                to: vault.to_account_info(),
            }
        );

        anchor_lang::system_program::transfer(cpi_context, game.stake_amount as u64)?;
        
        // game.prize_pool += game.stake_amount;

        game.players[player_index as usize] = player.key();
        game.player_count += 1;

        msg!("Player {} joined the game!", player.key());

        if (game.player_count as u8) == game.max_players {
            game.state = GameState::InProgress;
            msg!("The game is now full! The state is now InProgress.");
        }

        Ok(())
    }

    pub fn determine_winner(ctx: Context<DetermineWinner>) -> Result<()> {
        let game = &mut ctx.accounts.game_account;
        require!(game.state == GameState::InProgress, GameError::GameNotOpen);
        let clock = Clock::get()?;
        let random_seed = clock.slot;
        msg!("Using slot {} as random seed", random_seed);

        let mut highest_roll: u8 = 0;
        let mut winner_index: usize = 0;
        
        let active_players = game.players[..game.player_count as usize].to_vec();

        for (i, player_key) in active_players.iter().enumerate(){
            let combined_seed = random_seed.wrapping_add(i as u64).wrapping_add(u64::from_le_bytes([
                    player_key.to_bytes()[0],
                    player_key.to_bytes()[1],
                    player_key.to_bytes()[2],
                    player_key.to_bytes()[3],
                    player_key.to_bytes()[4],
                    player_key.to_bytes()[5],
                    player_key.to_bytes()[6],
                    player_key.to_bytes()[7],
            ]));

            let roll = (combined_seed % 10 + 1) as u8;
            game.rolls[i] = roll;
            msg!("Player {} rolled: {}", player_key, roll);
            if roll > highest_roll {
                highest_roll = roll;
                winner_index = i;
            }
        }

        let winner_pubkey = game.players[winner_index];
        game.winner = Some(winner_pubkey);
        game.state = GameState::Closed;
        msg!("Winner: {} with roll: {}", winner_pubkey, highest_roll);

        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let game = &ctx.accounts.game_account;
        let winner = &ctx.accounts.winner;
        let vault = &mut ctx.accounts.game_vault;
        // The constraints in the ClaimPrize context already handle authorization.
        msg!("Winner {} is claiming the prize.", winner.key());

        let prize_pool = game.prize_pool;
        let game_id_bytes = game.id.to_le_bytes();

        let seeds = &[
            b"game_vault",
            game_id_bytes.as_ref(),
            &[ctx.bumps.game_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: vault.to_account_info(),
                to: winner.to_account_info(),
            },
        ).with_signer(signer_seeds);

        transfer(cpi_context, prize_pool)?;
        msg!("Prize of {} lamports transferred to winner", prize_pool);
        ctx.accounts.lobby_account.current_game_id += 1;
        Ok(())
    }

}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum GameState {
    Open,
    InProgress,
    Closed,
}

#[account]
pub struct GameLobby {
    pub current_game_id: u64,
}

#[error_code]
pub enum GameError {
    #[msg("This game is not open for new players.")]
    GameNotOpen,
    #[msg("This game is already full.")]
    GameFull,
    #[msg("Player has already joined this game.")]
    AlreadyJoined,
    #[msg("Only the declared winner can claim the prize.")]
    NotTheWinner,
    #[msg("A winner has not been determined for this game yet.")]
    WinnerNotDetermined,
    #[msg("User has joined the game already")]
    AlreadyInGame
}

#[account]
#[derive(InitSpace)]
pub struct Game {
    pub creator: Pubkey,
    pub id: u64,
    pub state: GameState,
    pub stake_amount: u64,
    pub max_players: u8,
    pub prize_pool: u64,
    pub player_count: u8,
    pub players: [Pubkey; MAX_PLAYERS as usize],
    pub rolls: [u8; MAX_PLAYERS as usize],
    pub winner: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct InitGameLobby<'info> {
    #[account(
        init,
        payer = lobby_creator,
        space = 8 + 8,
        seeds = [b"game_lobby"],
        bump,
    )]
    pub lobby_account: Account<'info, GameLobby>,
    #[account(mut)]
    pub lobby_creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        mut,
        seeds = [b"game_lobby"],
        bump
    )]
    pub lobby_account: Account<'info, GameLobby>,
    #[account(
        init,
        payer = game_creator,
        seeds = [b"game", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
        space = 8 + Game::INIT_SPACE
    )]
    pub game_account: Account<'info, Game>,
    #[account(mut)]
    pub game_creator: Signer<'info>,
    #[account(
        mut,
        seeds = [b"game_vault", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
    )]
    /// CHECK: Empty vault account used only for holding lamports, no data validation needed
    pub game_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        seeds = [b"game_lobby"],
        bump
    )]
    pub lobby_account: Account<'info, GameLobby>,
    #[account(
        mut,
        seeds = [b"game", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game_account: Account<'info, Game>,
    #[account(
        mut,
        seeds = [b"game_vault", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
    )]
    /// CHECK: Empty vault account used only for holding lamports, no data validation needed
    pub game_vault: SystemAccount<'info>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DetermineWinner<'info> {
    #[account(
        mut,
        seeds = [b"game_lobby"],
        bump
    )]
    pub lobby_account: Account<'info, GameLobby>,
    #[account(
        mut,
        seeds = [b"game", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
        constraint = game_account.state == GameState::InProgress
    )]
    pub game_account: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(
        mut,
        seeds = [b"game_lobby"],
        bump
    )]
    pub lobby_account: Account<'info, GameLobby>,
    #[account(
        mut,
        seeds = [b"game", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
        constraint = game_account.winner.is_some() @ GameError::WinnerNotDetermined,
        constraint = game_account.winner.unwrap() == winner.key() @ GameError::NotTheWinner
    )]
    pub game_account: Account<'info, Game>,
    #[account(
        mut,
        seeds = [b"game_vault", lobby_account.current_game_id.to_le_bytes().as_ref()],
        bump,
    )]
    /// CHECK: Empty vault account used only for holding lamports, no data validation needed
    pub game_vault: SystemAccount<'info>,
    #[account(mut)]
    /// CHECK: Winner Acconunt, no data validation needed
    pub winner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}