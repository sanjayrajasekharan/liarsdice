import type { Meta, StoryObj } from '@storybook/react-vite';
import PlayerClaimsPopover from './PlayerClaimsPopover';

const meta = {
  title: 'Components/PlayerClaimsPopover',
  component: PlayerClaimsPopover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerClaimsPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithClaims: Story = {
  args: {
    playerName: 'Alice',
    claims: [
      { claimNumber: 1, playerId: '1', playerName: 'Alice', quantity: 2, faceValue: 3 },
      { claimNumber: 4, playerId: '1', playerName: 'Alice', quantity: 4, faceValue: 4 },
      { claimNumber: 7, playerId: '1', playerName: 'Alice', quantity: 6, faceValue: 5 },
    ],
    isOpen: true,
    onOpenChange: () => {},
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">
        Alice (Click me)
      </button>
    ),
  },
};

export const NoClaims: Story = {
  args: {
    playerName: 'Bob',
    claims: [],
    isOpen: true,
    onOpenChange: () => {},
    children: (
      <button className="px-4 py-2 bg-neutral-200 rounded-lg">
        Bob (No claims)
      </button>
    ),
  },
};

export const ManyClaims: Story = {
  args: {
    playerName: 'Charlie',
    claims: [
      { claimNumber: 1, playerId: '3', playerName: 'Charlie', quantity: 1, faceValue: 1 },
      { claimNumber: 3, playerId: '3', playerName: 'Charlie', quantity: 2, faceValue: 2 },
      { claimNumber: 5, playerId: '3', playerName: 'Charlie', quantity: 3, faceValue: 3 },
      { claimNumber: 7, playerId: '3', playerName: 'Charlie', quantity: 4, faceValue: 4 },
      { claimNumber: 9, playerId: '3', playerName: 'Charlie', quantity: 5, faceValue: 5 },
      { claimNumber: 11, playerId: '3', playerName: 'Charlie', quantity: 6, faceValue: 6 },
    ],
    isOpen: true,
    onOpenChange: () => {},
    children: (
      <button className="px-4 py-2 bg-neutral-200 rounded-lg">
        Charlie (6 claims)
      </button>
    ),
  },
};

export const YourClaims: Story = {
  args: {
    playerName: 'Your',
    claims: [
      { claimNumber: 2, playerId: '2', playerName: 'You', quantity: 2, faceValue: 3 },
      { claimNumber: 5, playerId: '2', playerName: 'You', quantity: 4, faceValue: 4 },
    ],
    isOpen: true,
    onOpenChange: () => {},
    children: (
      <button className="px-4 py-2 bg-primary-50 border-2 border-primary-300 rounded-lg">
        You (Click me)
      </button>
    ),
  },
};
