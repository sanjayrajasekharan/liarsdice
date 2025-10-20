export class Player {
    private id: string;
    private name: string;
    private ws: WebSocket | null;

    constructor(id: string, name: string, ws?: WebSocket) {
        this.id = id;
        this.name = name;
        this.ws = ws ? ws : null;
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }
    setWebSocket(ws: WebSocket): void {
        this.ws = ws;
    }
    getWebSocket(): WebSocket | null {
        return this.ws;
    }
}