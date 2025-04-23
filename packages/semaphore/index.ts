
export class Mutex {
  private listeners: (() => void)[] = [];

  async waitForPosession(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.listeners.length === 0) {

      }

    })
  }

  private relinquish() {
    if (this.listeners.length === 0) {
      return;
    }

  }
}
