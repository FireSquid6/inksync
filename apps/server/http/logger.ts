import Elysia from "elysia";

function logResponse(method: string, path: string, code: number | string) {
  let marker = "+";

  while (method.length < 5) {
    method = method + " ";
  }

  if (typeof code === "number" && code >= 400) {
    if (code < 500) {
      marker = "-";
    } else {
      marker = "!";
    }
  } else {
    if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN" || code === "INVALID_COOKIE_SIGNATURE") {
      marker = "!";
    } 
  }

  console.log(`${marker} ${method} ${path} -> ${code}`);
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
