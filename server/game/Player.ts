import WebSocket from 'ws';

export class Player {
  readonly privateId: string;
  readonly publicId: string;
  name: string;
  index: number;
  remainingDice: number = 6;
  dice: number[] = [];
  hasRolled: boolean = false;
  startRoll: number | null = null;
  active: boolean = false;
  isHost: boolean = false;
  ws: WebSocket | null = null;

  constructor(privateId: string, name: string, index: number, publicId: string) {
    this.privateId = privateId;
    this.name = name;
    this.index = index;
    this.publicId = publicId;
  }

  connect(ws: WebSocket) {
    this.ws = ws;
    this.active = true;
  }

  disconnect() {
    this.ws = null;
    this.active = false;
  }

  rollDice() {
    this.dice = Array.from({ length: this.remainingDice }, () => Math.floor(Math.random() * 6) + 1);
    this.hasRolled = true;
  }

  clearDice() {
    this.dice = [];
    this.hasRolled = false;
    this.startRoll = null;
  }

  send(message: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
