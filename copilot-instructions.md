# Liar's Dice
Liar's Dice is an online, link-sharing mulitplayer game implemented in this monorepo. 

## Project Structure
- client/ - React frontend for the game
- server/ - TS-Node backend for game logic and real-time communication
- shared/ - Shared types and utilities between client and server

## Language Preferences
- TypeScript for both client and server with strict typing
- TypeScript should not use Promises directly; use async/await syntax instead.

## Dev Environment Usage
- pnpm is used as the package manager.
- server:
    `pnpm run build` to compile the server 
    `pnpm run dev` to start the server in development mode
    `pnpm run start` to start the server in production mode
- client:
    `pnpm run dev` to start the React development server
    `pnpm run build` to create a production build

## Important Notes
- old-index.ts files are deprecated; just used to retain the old code for reference.