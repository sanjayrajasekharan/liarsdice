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
    claimHistory: [
      { playerId: '1', playerName: 'Alice', quantity: 4, faceValue: 5 },
    ],
    currentPlayerId: '2',
  },
};

export const WithHistory: Story = {
  args: {
    claimHistory: [
      { playerId: '2', playerName: 'You', quantity: 2, faceValue: 3 },
      { playerId: '3', playerName: 'Bob', quantity: 3, faceValue: 3 },
      { playerId: '1', playerName: 'Alice', quantity: 3, faceValue: 4 },
      { playerId: '2', playerName: 'You', quantity: 4, faceValue: 4 },
      { playerId: '3', playerName: 'Bob', quantity: 5, faceValue: 4 },
      { playerId: '1', playerName: 'Alice', quantity: 6, faceValue: 4 },
    ],
    currentPlayerId: '2',
  },
};

export const LongHistory: Story = {
  args: {
    claimHistory: [
      { playerId: '2', playerName: 'You', quantity: 1, faceValue: 2 },
      { playerId: '3', playerName: 'Bob', quantity: 2, faceValue: 2 },
      { playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { playerId: '2', playerName: 'You', quantity: 3, faceValue: 3 },
      { playerId: '3', playerName: 'Bob', quantity: 4, faceValue: 3 },
      { playerId: '1', playerName: 'Alice', quantity: 5, faceValue: 3 },
      { playerId: '2', playerName: 'You', quantity: 5, faceValue: 4 },
      { playerId: '3', playerName: 'Bob', quantity: 6, faceValue: 4 },
      { playerId: '1', playerName: 'Alice', quantity: 7, faceValue: 4 },
      { playerId: '2', playerName: 'You', quantity: 8, faceValue: 5 },
      { playerId: '3', playerName: 'Bob', quantity: 10, faceValue: 5 },
      { playerId: '1', playerName: 'Alice', quantity: 12, faceValue: 6 },
    ],
    currentPlayerId: '2',
  },
};

export const Empty: Story = {
  args: {
    claimHistory: [],
    currentPlayerId: '1',
  },
};

export const YourCurrentClaim: Story = {
  args: {
    claimHistory: [
      { playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { playerId: '2', playerName: 'You', quantity: 3, faceValue: 3 },
      { playerId: '1', playerName: 'Alice', quantity: 4, faceValue: 3 },
      { playerId: '2', playerName: 'You', quantity: 5, faceValue: 3 },
    ],
    currentPlayerId: '2',
  },
};
