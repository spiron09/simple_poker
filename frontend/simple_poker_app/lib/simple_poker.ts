/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/simple_poker.json`.
 */
export type SimplePoker = {
  "address": "ACX7FXn1jP1j1X4TNVVq4Fxw5Mot8kicwTeBh3yBno8B",
  "metadata": {
    "name": "simplePoker",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimPrize",
      "discriminator": [
        157,
        233,
        139,
        121,
        246,
        62,
        234,
        235
      ],
      "accounts": [
        {
          "name": "lobbyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  108,
                  111,
                  98,
                  98,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "gameAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "lobbyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  108,
                  111,
                  98,
                  98,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "gameAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "gameCreator",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "maxPlayers",
          "type": "u8"
        }
      ]
    },
    {
      "name": "determineWinner",
      "discriminator": [
        73,
        160,
        161,
        62,
        27,
        247,
        166,
        31
      ],
      "accounts": [
        {
          "name": "lobbyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  108,
                  111,
                  98,
                  98,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "gameAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initGameLobby",
      "discriminator": [
        248,
        49,
        105,
        24,
        159,
        27,
        22,
        26
      ],
      "accounts": [
        {
          "name": "lobbyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  108,
                  111,
                  98,
                  98,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "lobbyCreator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "lobbyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  108,
                  111,
                  98,
                  98,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "gameAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lobby_account.current_game_id",
                "account": "gameLobby"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    },
    {
      "name": "gameLobby",
      "discriminator": [
        189,
        224,
        58,
        79,
        92,
        234,
        22,
        140
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameNotOpen",
      "msg": "This game is not open for new players."
    },
    {
      "code": 6001,
      "name": "gameFull",
      "msg": "This game is already full."
    },
    {
      "code": 6002,
      "name": "alreadyJoined",
      "msg": "Player has already joined this game."
    },
    {
      "code": 6003,
      "name": "notTheWinner",
      "msg": "Only the declared winner can claim the prize."
    },
    {
      "code": 6004,
      "name": "winnerNotDetermined",
      "msg": "A winner has not been determined for this game yet."
    },
    {
      "code": 6005,
      "name": "alreadyInGame",
      "msg": "User has joined the game already"
    }
  ],
  "types": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "gameState"
              }
            }
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "type": "u8"
          },
          {
            "name": "prizePool",
            "type": "u64"
          },
          {
            "name": "playerCount",
            "type": "u8"
          },
          {
            "name": "players",
            "type": {
              "array": [
                "pubkey",
                10
              ]
            }
          },
          {
            "name": "rolls",
            "type": {
              "array": [
                "u8",
                10
              ]
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "isClaimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gameLobby",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "currentGameId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "inProgress"
          },
          {
            "name": "closed"
          }
        ]
      }
    }
  ]
};
