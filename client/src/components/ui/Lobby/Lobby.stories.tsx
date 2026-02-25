import type { Meta, StoryObj } from '@storybook/react-vite';
import Lobby from './Lobby';

const meta = {
  title: 'Components/Lobby',
  component: Lobby,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    players: {
      control: { type: 'object' },
      description: 'Array of players in the lobby',
    },
    maxPlayers: {
      control: { type: 'number', min: 2, max: 6 },
      description: 'Maximum number of players allowed',
    },
    onStartGame: {
      action: 'startGame',
      description: 'Callback when start game is triggered',
    },
  },
} satisfies Meta<typeof Lobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPlayers: Story = {
  args: {
    players: [
      { name: 'Alice', isHost: true, isPlayer: true },
      { name: 'Bob', isHost: false, isPlayer: false },
    ],
    maxPlayers: 6,
    onStartGame: () => console.log('Start game'),
  },
};

export const FullLobby: Story = {
  args: {
    players: [
      { name: 'Alice', isHost: true, isPlayer: true },
      { name: 'Bob', isHost: false, isPlayer: false },
      { name: 'Charlie', isHost: false, isPlayer: false },
      { name: 'Diana', isHost: false, isPlayer: false },
      { name: 'Eve', isHost: false, isPlayer: false },
      { name: 'Frank', isHost: false, isPlayer: false },
    ],
    maxPlayers: 6,
    onStartGame: () => console.log('Start game'),
  },
};

export const WaitingForPlayers: Story = {
  args: {
    players: [
      { name: 'Alice', isHost: true, isPlayer: true },
    ],
    maxPlayers: 6,
    onStartGame: () => console.log('Start game'),
  },
};

export const FourPlayerGame: Story = {
  args: {
    players: [
      { name: 'Alice', isHost: true, isPlayer: false },
      { name: 'Bob', isHost: false, isPlayer: true },
      { name: 'Charlie', isHost: false, isPlayer: false },
      { name: 'Diana', isHost: false, isPlayer: false },
    ],
    maxPlayers: 4,
    onStartGame: () => console.log('Start game'),
  },
};
