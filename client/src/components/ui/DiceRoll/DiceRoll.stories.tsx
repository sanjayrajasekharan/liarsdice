import type { Meta, StoryObj } from '@storybook/react-vite';
import DiceRoll from './DiceRoll';

const meta = {
  title: 'Components/DiceRoll',
  component: DiceRoll,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    dice: {
      control: { type: 'object' },
      description: 'Array of dice values (1-6)',
    },
    isRolling: {
      control: { type: 'boolean' },
      description: 'Whether to show rolling animation',
    },
    onRollComplete: {
      action: 'rollComplete',
      description: 'Callback when roll animation finishes',
    },
  },
} satisfies Meta<typeof DiceRoll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FiveDice: Story = {
  args: {
    dice: [1, 3, 4, 6, 2],
    isRolling: false,
  },
};

export const ThreeDice: Story = {
  args: {
    dice: [5, 5, 3],
    isRolling: false,
  },
};

export const OneDie: Story = {
  args: {
    dice: [6],
    isRolling: false,
  },
};

export const Rolling: Story = {
  args: {
    dice: [1, 2, 3, 4, 5],
    isRolling: true,
  },
};

export const AllSixes: Story = {
  args: {
    dice: [6, 6, 6, 6, 6],
    isRolling: false,
  },
};
