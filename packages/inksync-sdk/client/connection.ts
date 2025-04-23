import { makeMessage, parseMessage, type Message } from "..";

type MessageHandler = (message: Message) => void;

function getUrlFromAddress(address: string) {
  const split = address.split(":");

  const protocol = split[0] === "127.0.0.1" || split[0] === "localhost" ? "ws" : "wss";

  return `${protocol}://${address}/listen`
}

export class InksyncConnection {
  private socket: WebSocket;
  private listeners: MessageHandler[] = [];
  private connectListeners: ((status: "CONNECT" | "ERROR") => void)[] = [];

  constructor(address: string) {
    const url = getUrlFromAddress(address);
    console.log(`Connecting to ${url}`);
    this.socket = new WebSocket(url);

    this.socket.onmessage = (e) => {
      console.log("Got message: ", e.data);
      const message = parseMessage(e.data);

      if (message instanceof Error) {
        throw new Error(`Error parsing message from server: ${message.message}`);
      }
      console.log(`<-- ${message.type}`);
      this.handleMessage(message)
    }

    this.socket.onopen = () => {
      console.log("SOCKET EVENT: open");
      for (const connectListener of this.connectListeners) {
        connectListener("CONNECT");
      }
    }

    this.socket.onclose = () => {
      console.log("SOCKET EVENT: closed");
    }

    this.socket.onerror = (e) => {
      for (const connectListener of this.connectListeners) {
        connectListener("ERROR");
      }
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
    console.log(`---> ${message.type}`); 
    this.socket.send(makeMessage(message));
  }

  onceMessage(listener: MessageHandler) {
    this.listeners.push((m) => {
      listener(m);
      this.listeners.filter((l) => l !== listener);
    })
  }

  async sendAndRecieve(message: Message): Promise<Message> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        throw new Error(`Error while sending ${message.type} message: timed out after 5000 ms`);
      }, 5000);

      this.onceMessage((m) => {
        clearTimeout(timer);
        resolve(m);
      });

      this.sendMessage(message);
    })
  }

  onceConnect(listener: (status: "CONNECT" | "ERROR") => void) {
    this.connectListeners.push((s) => {
      listener(s);
      this.connectListeners.filter((l) => l !== listener);
    });
  }

  async waitForConnection(): Promise<void> {
    if (this.socket.readyState !== 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.onceConnect((s) => {
        if (s === "CONNECT") {
          resolve();
          return;
        }

        throw new Error("Failed to connect");
      })
    })

  }
}
