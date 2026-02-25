import type { Meta, StoryObj } from "@storybook/react-vite";
import ToastProvider from "./ToastProvider";
import { toast } from "../../../store/toastStore";

const meta = {
  title: "Components/Toast",
  component: ToastProvider,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component with buttons to trigger toasts
const ToastDemo = () => {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-text-primary mb-6">Toast Demo</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-primary"
          onClick={() => toast.info("Player joined", "Alice has entered the game")}
        >
          Info Toast
        </button>
        
        <button
          className="btn-primary bg-green-600 hover:bg-green-700"
          onClick={() => toast.success("Your turn!", "Make a claim or challenge")}
        >
          Success Toast
        </button>
        
        <button
          className="btn-primary bg-yellow-600 hover:bg-yellow-700"
          onClick={() => toast.warning("Player left", "Bob has disconnected")}
        >
          Warning Toast
        </button>
        
        <button
          className="btn-primary bg-red-600 hover:bg-red-700"
          onClick={() => toast.error("Connection lost", "Trying to reconnect...")}
        >
          Error Toast
        </button>
      </div>

      <hr className="border-border-light my-6" />

      <div className="space-y-3">
        <button
          className="btn-secondary w-full"
          onClick={() => toast.info("Simple message")}
        >
          Title Only
        </button>
        
        <button
          className="btn-secondary w-full"
          onClick={() => toast.success("Quick!", undefined, 1500)}
        >
          Short Duration (1.5s)
        </button>
        
        <button
          className="btn-secondary w-full"
          onClick={() => toast.info("This stays longer", "Important message", 10000)}
        >
          Long Duration (10s)
        </button>

        <button
          className="btn-secondary w-full"
          onClick={() => {
            toast.info("First");
            toast.success("Second");
            toast.warning("Third");
          }}
        >
          Multiple Toasts
        </button>
      </div>
    </div>
  );
};

export const Interactive: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="min-h-screen bg-surface-primary p-8">
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>
    </div>
  ),
};

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="min-h-screen bg-surface-primary p-8">
      <ToastProvider>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            Toast Notifications
          </h2>
          <p className="text-text-secondary mb-4">
            Toasts appear in the bottom-right corner and auto-dismiss after 4 seconds by default.
          </p>
          <button
            className="btn-primary"
            onClick={() => toast.info("Hello!", "This is a toast notification")}
          >
            Show Toast
          </button>
        </div>
      </ToastProvider>
    </div>
  ),
};
