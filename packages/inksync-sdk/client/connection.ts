import { makeMessage, parseMessage, type Message } from "..";

type MessageHandler = (message: Message) => void;

export class InksyncConnection {
  private socket: WebSocket;
  private listeners: MessageHandler[] = [];

  constructor(address: string) {
    this.socket = new WebSocket(`ws://${address}/listen`);

    this.socket.onmessage = (e) => {
      const message = parseMessage(e.data);

      if (message instanceof Error) {
        throw new Error(`Error parsing message from server: ${message.message}`);
      }

      this.handleMessage(message)
    }

    this.socket.onclose = () => {
      console.log("Socket closed");
    }

    this.socket.onerror = (e) => {
      throw new Error(`Websocket error: ${e}`);
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

  sendMessage(message: Message) {
    this.socket.send(makeMessage(message));
  }

  async sendAndRecieve(message: Message): Promise<Message> {
    return new Promise((resolve) => {
      const unsubscribe = this.onMessage((m) => {
        clearTimeout(timer);
        resolve(m);
        unsubscribe();
      });

      this.socket.send(makeMessage(message));

      const timer = setTimeout(() => {
        throw new Error(`Error while sending ${message.type} message: timed out after 5000 ms`);
      }, 5000);
    })
  }
}
