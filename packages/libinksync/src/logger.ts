
export interface Logger {
  log(...args: any): void;
  error(...args: any): void;
}


export function silentLogger(): Logger {
  return {
    log(..._: any): void {
    },
    error(..._: any): void {
    },
  }
}

export function consoleLogger(): Logger {
  return {
    log(...args: any): void {
      console.log(args);
    },
    error(...args: any): void {
      console.error(args);
    },
  }
}
