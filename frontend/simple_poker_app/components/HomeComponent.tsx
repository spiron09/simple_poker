'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { CreateGameForm } from '@/components/CreateGameForm'
import { GameList } from '@/components/GameList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Badge } from '@/components/ui/badge'
import { initLobby, isLobbyInitialized, useProgram } from '@/lib/AnchorClient'
import { useEffect } from 'react'
import { lobbyInitAtom, lobbyIsLoadingAtom } from '@/store/gameState'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

export function HomeComponent() {
  const { connected } = useWallet()
  const program = useProgram()
  const [lobbyInitialized, setLobbyInitialized] = useAtom(lobbyInitAtom)
  const [lobbyLoading, setLobbyLoading] = useAtom(lobbyIsLoadingAtom)

  useEffect(() => {
    const fetchLobbyState = async () => {
      if (program) {
        try {
          setLobbyLoading(true)
          const isInitialized = await isLobbyInitialized(program)
          setLobbyInitialized(isInitialized)

          toast.info('Lobby status checked.', {
            description: isInitialized
              ? 'Lobby is ready.'
              : 'Lobby needs initialization.',
          })
        } catch (error) {
          console.error('Error fetching lobby state:', error)
          toast.error('Failed to fetch lobby state.')
        } finally {
          setLobbyLoading(false)
        }
      }
    }
    fetchLobbyState()
  }, [program, setLobbyInitialized, setLobbyLoading])

  const handleInitLobby = async () => {
    if (!program) {
      console.error('Program not loaded')
      toast.error('Cannot initialize lobby. Program not available.')
      return
    }
    const toastId = toast.loading('Initializing the lobby...')
    try {
      setLobbyLoading(true)
      const initialized = await initLobby(program)
      toast.success('Lobby initialized successfully!', { id: toastId })
      setLobbyInitialized(initialized)
    } catch (error) {
      console.error('Error initializing lobby:', error)
      toast.error('Failed to initialize lobby. Please try again.', {
        id: toastId,
      })
    } finally {
      setLobbyLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Simple Poker</h1>
        <div className="flex items-center gap-x-4">
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/spiron09/simple_poker"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source code on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          {connected &&
            program &&
            (lobbyLoading ? (
              <Badge variant="secondary">Checking Lobby...</Badge>
            ) : lobbyInitialized ? (
              <Badge variant="secondary">Lobby Ready</Badge>
            ) : (
              <Button
                onClick={handleInitLobby}
                className="text-sm text-primary"
                variant="secondary"
              >
                Initialize Lobby
              </Button>
            ))}
          <WalletMultiButton />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-4 pt-12">
        {connected ? (
          program ? (
            <Tabs defaultValue="join-game" className="w-full max-w-4xl">
              <TabsList className="grid w-full grid-cols-2 bg-card">
                <TabsTrigger value="join-game">Join Game</TabsTrigger>
                <TabsTrigger value="create-game">Create Game</TabsTrigger>
              </TabsList>
              <TabsContent value="join-game" className="mt-6">
                <GameList />
              </TabsContent>
              <TabsContent value="create-game" className="mt-6">
                <div className="flex justify-center">
                  <CreateGameForm />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div>Initializing Program...</div>
          )
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome to Simple Poker</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              This game has been deployed on the devnet, please import your
              devnet wallets with SOL to play.
              <br />
              Connect your wallet to play.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default HomeComponent
