import { parseMessage, type Message } from ".";

type MessageHandler = (message: Message) => void;

export class InksyncClient {
  private socket: WebSocket;
  private listeners: MessageHandler[] = [];

  constructor(address: string) {
    this.socket = new WebSocket(`ws://${address}/listen`);

    this.socket.onmessage = (e: Bun.BunMessageEvent<string>) => {
      const message = parseMessage(e.data);

      if (message instanceof Error) {
        throw new Error(`Error parsing message from server: ${message.message}`);
      }

      this.handleMessage(message)
    }
  }

  private handleMessage(message: Message) {
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  onMessage(listener: MessageHandler): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners.filter((l) => l !== listener);
    }
  }
}
