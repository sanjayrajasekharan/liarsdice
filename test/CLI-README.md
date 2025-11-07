# Liar's Dice CLI Client

A simple command-line tool to connect and play Liar's Dice.

## Prerequisites

- Node.js installed
- Server running on `http://localhost:3000`

## Installation

Install socket.io-client in the workspace root:

```powershell
npm install socket.io-client
```

## Usage

### Create a New Game

```powershell
node cli-client.js create YourName
```

This will create a new game and display the game code. Share this code with other players.

### Join an Existing Game

```powershell
node cli-client.js join GAMECODE YourName
```

Replace `GAMECODE` with the code from the game creator.

## Game Commands

Once connected, use these commands:

| Command | Shortcut | Description | Example |
|---------|----------|-------------|---------|
| `start` | - | Start the game (when ready) | `start` |
| `roll` | - | Start a new round | `roll` |
| `claim <qty> <face>` | `c` | Make a claim | `claim 3 5` |
| `challenge` | `ch` | Challenge last claim | `challenge` |
| `dice` | - | Show your dice | `dice` |
| `help` | `h` | Show help | `help` |
| `quit` | - | Exit game | `quit` |

## Example Game Flow

**Player 1 (Terminal 1):**
```powershell
node cli-client.js create Alice
# Output: Game created! Code: ABC123
```

**Player 2 (Terminal 2):**
```powershell
node cli-client.js join ABC123 Bob
# Output: Joined game!
```

**Player 1:**
```
> start
> roll
# Your dice: ⚀ ⚂ ⚄
> claim 2 3
```

**Player 2:**
```
# Alice claims: 2x ⚂
> challenge
# CHALLENGE! Winner: Bob | Loser: Alice
```

## Features

- 🎨 Colorful terminal output
- 🎲 Emoji dice display
- ⚡ Real-time updates via WebSocket
- 📢 Event notifications (joins, claims, challenges)
- 🏆 Game winner announcement

## Troubleshooting

**Connection failed:**
- Make sure the server is running: `cd server && pnpm run dev`
- Verify server is on port 3000

**Invalid token:**
- Rejoin the game with a new player name

**Command not working:**
- Type `help` to see available commands
- Check if it's your turn (only current player can claim/challenge)
