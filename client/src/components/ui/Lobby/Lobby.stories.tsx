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
    onReorder: {
      action: 'reorder',
      description: 'Callback when players are reordered (host only)',
    },
    isHost: {
      control: { type: 'boolean' },
      description: 'Whether the current user is the host',
    },
  },
} satisfies Meta<typeof Lobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPlayers: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', isHost: true, isPlayer: true },
      { id: '2', name: 'Bob', isHost: false, isPlayer: false },
    ],
    maxPlayers: 6,
    isHost: true,
    onStartGame: () => console.log('Start game'),
    onReorder: (ids) => console.log('Reordered:', ids),
  },
};

export const FullLobby: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', isHost: true, isPlayer: true },
      { id: '2', name: 'Bob', isHost: false, isPlayer: false },
      { id: '3', name: 'Charlie', isHost: false, isPlayer: false },
      { id: '4', name: 'Diana', isHost: false, isPlayer: false },
      { id: '5', name: 'Eve', isHost: false, isPlayer: false },
      { id: '6', name: 'Frank', isHost: false, isPlayer: false },
    ],
    maxPlayers: 6,
    isHost: true,
    onStartGame: () => console.log('Start game'),
    onReorder: (ids) => console.log('Reordered:', ids),
  },
};

export const WaitingForPlayers: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', isHost: true, isPlayer: true },
    ],
    maxPlayers: 6,
    isHost: true,
    onStartGame: () => console.log('Start game'),
    onReorder: (ids) => console.log('Reordered:', ids),
  },
};

export const FourPlayerGame: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', isHost: true, isPlayer: false },
      { id: '2', name: 'Bob', isHost: false, isPlayer: true },
      { id: '3', name: 'Charlie', isHost: false, isPlayer: false },
      { id: '4', name: 'Diana', isHost: false, isPlayer: false },
    ],
    maxPlayers: 4,
    isHost: false,
    onStartGame: () => console.log('Start game'),
  },
};

export const NonHostView: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', isHost: true, isPlayer: false },
      { id: '2', name: 'Bob', isHost: false, isPlayer: true },
      { id: '3', name: 'Charlie', isHost: false, isPlayer: false },
    ],
    maxPlayers: 6,
    isHost: false,
    onStartGame: () => console.log('Start game'),
  },
};
