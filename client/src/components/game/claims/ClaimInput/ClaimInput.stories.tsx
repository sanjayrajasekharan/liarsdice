import type { Meta, StoryObj } from '@storybook/react-vite';
import ClaimInput from './ClaimInput';

const meta = {
  title: 'Components/ClaimInput',
  component: ClaimInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentDieValue: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6],
      description: 'The current die face value in the game',
    },
    currentCount: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'The current count of dice claimed',
    },
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    onClose: { action: 'closed' },
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof ClaimInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentDieValue: 3,
    currentCount: 2,
    isOpen: true,
    onClose: () => console.log('Closed'),
    onSubmit: (diceValue: number, count: number) => console.log('Submitted:', { diceValue, count }),
  },
};

export const StartOfGame: Story = {
  args: {
    currentDieValue: 1,
    currentCount: 0,
    isOpen: true,
    onClose: () => console.log('Closed'),
    onSubmit: (diceValue: number, count: number) => console.log('Submitted:', { diceValue, count }),
  },
};

export const HighCount: Story = {
  args: {
    currentDieValue: 6,
    currentCount: 10,
    isOpen: true,
    onClose: () => console.log('Closed'),
    onSubmit: (diceValue: number, count: number) => console.log('Submitted:', { diceValue, count }),
  },
};
