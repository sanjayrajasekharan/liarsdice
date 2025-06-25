import WebSocket from 'ws';

export class Player {
  readonly bearerToken: string;
  readonly playerId: string;
  name: string;
  index: number;
  remainingDice: number = 6;
  dice: number[] = [];
  hasRolled: boolean = false;
  startRoll: number | null = null;
  active: boolean = false;
  isHost: boolean = false;
  ws: WebSocket | null = null;

  constructor(playerId: string, name: string, index: number) {
    this.bearerToken = this.generateBearerToken();
    this.name = name;
    this.index = index;
    this.playerId = playerId;
  }

  connect(ws: WebSocket) {
    this.ws = ws;
    this.active = true;
  }

  disconnect() {
    this.ws = null;
    this.active = false;
  }

  private generateBearerToken(): string {
    return 'Bearer ' + Math.random().toString(36).substring(2);
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

  resetForRound() {
    this.clearDice();
    this.hasRolled = false;
    this.startRoll = null;
  }

  send(message: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public get privateId(): string {
    return this.playerId;
  }
}
