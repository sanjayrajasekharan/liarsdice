import type { Meta, StoryObj } from '@storybook/react-vite';
import ClaimTimeline from './ClaimTimeline';

const meta = {
  title: 'Components/ClaimTimeline',
  component: ClaimTimeline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClaimTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentClaimOnly: Story = {
  args: {
    currentClaim: {
      playerId: '1',
      playerName: 'Alice',
      quantity: 4,
      faceValue: 5,
    },
    claimHistory: [
      { claimNumber: 1, playerId: '1', playerName: 'Alice', quantity: 4, faceValue: 5 },
    ],
    currentPlayerId: '2',
  },
};

export const WithHistory: Story = {
  args: {
    currentClaim: {
      playerId: '1',
      playerName: 'Alice',
      quantity: 6,
      faceValue: 4,
    },
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'You', quantity: 2, faceValue: 3 },
      { claimNumber: 2, playerId: '3', playerName: 'Bob', quantity: 3, faceValue: 3 },
      { claimNumber: 3, playerId: '1', playerName: 'Alice', quantity: 3, faceValue: 4 },
      { claimNumber: 4, playerId: '2', playerName: 'You', quantity: 4, faceValue: 4 },
      { claimNumber: 5, playerId: '3', playerName: 'Bob', quantity: 5, faceValue: 4 },
      { claimNumber: 6, playerId: '1', playerName: 'Alice', quantity: 6, faceValue: 4 },
    ],
    currentPlayerId: '2',
  },
};

export const LongHistory: Story = {
  args: {
    currentClaim: {
      playerId: '1',
      playerName: 'Alice',
      quantity: 12,
      faceValue: 6,
    },
    claimHistory: [
      { claimNumber: 1, playerId: '2', playerName: 'You', quantity: 1, faceValue: 2 },
      { claimNumber: 2, playerId: '3', playerName: 'Bob', quantity: 2, faceValue: 2 },
      { claimNumber: 3, playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { claimNumber: 4, playerId: '2', playerName: 'You', quantity: 3, faceValue: 3 },
      { claimNumber: 5, playerId: '3', playerName: 'Bob', quantity: 4, faceValue: 3 },
      { claimNumber: 6, playerId: '1', playerName: 'Alice', quantity: 5, faceValue: 3 },
      { claimNumber: 7, playerId: '2', playerName: 'You', quantity: 5, faceValue: 4 },
      { claimNumber: 8, playerId: '3', playerName: 'Bob', quantity: 6, faceValue: 4 },
      { claimNumber: 9, playerId: '1', playerName: 'Alice', quantity: 7, faceValue: 4 },
      { claimNumber: 10, playerId: '2', playerName: 'You', quantity: 8, faceValue: 5 },
      { claimNumber: 11, playerId: '3', playerName: 'Bob', quantity: 10, faceValue: 5 },
      { claimNumber: 12, playerId: '1', playerName: 'Alice', quantity: 12, faceValue: 6 },
    ],
    currentPlayerId: '2',
  },
};

export const Empty: Story = {
  args: {
    currentClaim: null,
    claimHistory: [],
    currentPlayerId: '1',
  },
};

export const YourCurrentClaim: Story = {
  args: {
    currentClaim: {
      playerId: '2',
      playerName: 'You',
      quantity: 5,
      faceValue: 3,
    },
    claimHistory: [
      { claimNumber: 1, playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { claimNumber: 2, playerId: '2', playerName: 'You', quantity: 3, faceValue: 3 },
      { claimNumber: 3, playerId: '1', playerName: 'Alice', quantity: 4, faceValue: 3 },
      { claimNumber: 4, playerId: '2', playerName: 'You', quantity: 5, faceValue: 3 },
    ],
    currentPlayerId: '2',
  },
};
