
export async function consoleBreakpoint() {
  await new Promise<void>(async (resolve) => {
    console.log("Waiting for console input:");
    for await (const _ of console) {
      resolve();
    }
  });
}
