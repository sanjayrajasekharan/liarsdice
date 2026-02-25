import type { Meta, StoryObj } from '@storybook/react-vite';
import Reveal from './Reveal';

const meta = {
  title: 'Components/Reveal',
  component: Reveal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    playerCounts: {
      control: { type: 'object' },
      description: 'Array of players with their count of the challenged face',
    },
    claimedFace: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6],
      description: 'The face value that was claimed',
    },
    actualTotal: {
      control: { type: 'number' },
      description: 'Total count of the claimed face across all players',
    },
    currentPlayerId: {
      control: { type: 'text' },
      description: 'The current player ID (to show "You")',
    },
  },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePlayers: Story = {
  args: {
    playerCounts: [
      { playerId: 'p1', playerName: 'Alice', count: 2 },
      { playerId: 'p2', playerName: 'Bob', count: 3 },
      { playerId: 'p3', playerName: 'Charlie', count: 1 },
    ],
    claimedFace: 4,
    actualTotal: 6,
    currentPlayerId: 'p1',
  },
};

export const TwoPlayers: Story = {
  args: {
    playerCounts: [
      { playerId: 'p1', playerName: 'You', count: 3 },
      { playerId: 'p2', playerName: 'Opponent', count: 1 },
    ],
    claimedFace: 6,
    actualTotal: 4,
    currentPlayerId: 'p1',
  },
};

export const SixPlayers: Story = {
  args: {
    playerCounts: [
      { playerId: 'p1', playerName: 'Alice', count: 1 },
      { playerId: 'p2', playerName: 'Bob', count: 2 },
      { playerId: 'p3', playerName: 'Charlie', count: 3 },
      { playerId: 'p4', playerName: 'Diana', count: 0 },
      { playerId: 'p5', playerName: 'Eve', count: 2 },
      { playerId: 'p6', playerName: 'Frank', count: 1 },
    ],
    claimedFace: 3,
    actualTotal: 9,
    currentPlayerId: 'p1',
  },
};

export const PlayerWithZero: Story = {
  args: {
    playerCounts: [
      { playerId: 'p1', playerName: 'Alice', count: 2 },
      { playerId: 'p2', playerName: 'Bob', count: 0 },
      { playerId: 'p3', playerName: 'Charlie', count: 3 },
    ],
    claimedFace: 5,
    actualTotal: 5,
    currentPlayerId: 'p1',
  },
};

export const ChallengerWins: Story = {
  args: {
    playerCounts: [
      { playerId: 'p1', playerName: 'Alice', count: 1 },
      { playerId: 'p2', playerName: 'Bob', count: 1 },
      { playerId: 'p3', playerName: 'Charlie', count: 0 },
    ],
    claimedFace: 2,
    actualTotal: 2,
    currentPlayerId: 'p2',
  },
};
