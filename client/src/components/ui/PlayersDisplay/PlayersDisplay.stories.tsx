import type { Meta, StoryObj } from '@storybook/react-vite';
import PlayersDisplay from './PlayersDisplay';

const meta = {
  title: 'Components/PlayersDisplay',
  component: PlayersDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    players: {
      control: { type: 'object' },
      description: 'Array of players with their dice counts and status',
    },
    showEliminated: {
      control: { type: 'boolean' },
      description: 'Whether to show eliminated players (0 dice)',
    },
  },
} satisfies Meta<typeof PlayersDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', diceCount: 5, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Bob', diceCount: 4, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Charlie', diceCount: 3, isCurrentTurn: false, isUser: false },
    ],
    claimHistory: [
      { claimNumber: 1, playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { claimNumber: 2, playerId: '2', playerName: 'Bob', quantity: 3, faceValue: 3 },
      { claimNumber: 3, playerId: '3', playerName: 'Charlie', quantity: 4, faceValue: 3 },
      { claimNumber: 4, playerId: '1', playerName: 'Alice', quantity: 5, faceValue: 3 },
    ],
  },
};

export const LongNames: Story = {
  args: {
    players: [
      { id: '1', name: 'Alexander the Great', diceCount: 5, isCurrentTurn: true, isUser: false },
      { id: '2', name: 'Bob', diceCount: 4, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Christopher Columbus', diceCount: 3, isCurrentTurn: false, isUser: true },
      { id: '4', name: 'Diana', diceCount: 2, isCurrentTurn: false, isUser: false },
    ],
  },
};

export const SixPlayers: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', diceCount: 5, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Bob', diceCount: 4, isCurrentTurn: true, isUser: false },
      { id: '3', name: 'Charlie', diceCount: 3, isCurrentTurn: false, isUser: false },
      { id: '4', name: 'Diana', diceCount: 5, isCurrentTurn: false, isUser: false },
      { id: '5', name: 'Eve', diceCount: 2, isCurrentTurn: false, isUser: false },
      { id: '6', name: 'Frank', diceCount: 1, isCurrentTurn: false, isUser: false },
    ],
  },
};

export const WithEliminatedPlayers: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', diceCount: 3, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Bob', diceCount: 0, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Charlie', diceCount: 1, isCurrentTurn: true, isUser: false },
      { id: '4', name: 'Diana', diceCount: 0, isCurrentTurn: false, isUser: false },
    ],
    showEliminated: false, // Default - eliminated players hidden
  },
};

export const ShowEliminatedPlayers: Story = {
  args: {
    players: [
      { id: '1', name: 'Alice', diceCount: 3, isCurrentTurn: false, isUser: true },
      { id: '2', name: 'Bob', diceCount: 0, isCurrentTurn: false, isUser: false },
      { id: '3', name: 'Charlie', diceCount: 1, isCurrentTurn: true, isUser: false },
      { id: '4', name: 'Diana', diceCount: 0, isCurrentTurn: false, isUser: false },
    ],
    showEliminated: true, // Show eliminated players
  },
};

export const YourTurn: Story = {
  args: {
    players: [
      { id: '1', name: 'You', diceCount: 4, isCurrentTurn: true, isUser: true },
      { id: '2', name: 'Opponent', diceCount: 3, isCurrentTurn: false, isUser: false },
    ],
  },
};
