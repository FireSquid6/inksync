import Elysia from "elysia";

function logResponse(method: string, path: string, code: number | string) {
  console.log(`- ${method} ${path} -> ${code}`);
}

export const loggerPlugin = new Elysia()
  .onAfterResponse({ as: "global" }, (ctx) => {
    const method = ctx.request.method;
    const path = ctx.path;
    const status = ctx.set.status;
    logResponse(method, path, status ?? 500);
  })
  .onError({ as: "global" }, (ctx) => {
    const method = ctx.request.method;
    const path = ctx.path;
    logResponse(method, path, ctx.code)
  })
