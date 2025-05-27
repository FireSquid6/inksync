
export interface Logger {
  log(text: string): void;
  error(text: string): void;
}


export function silentLogger(): Logger {
  return {
    log(_: string): void {
    },
    error(_: string): void {
    },
  }
}

export function consoleLogger(): Logger {
  return {
    log(data: string): void {
      console.log(data);
    },
    error(data: string): void {
      console.error(data);
    },
  }
}
