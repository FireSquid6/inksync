import Elysia from "elysia"
import { html } from "@elysiajs/html";
import { BaseLayout } from "./layouts/base";
import { staticPlugin } from "@elysiajs/static";
import path from "path";

export const uiPlugin = () => {
  

  return new Elysia({
    name: "ui",
  })
    .use(html())
    .use(staticPlugin({
      prefix: "/static",
      assets: "./ui/public",
    }))
    .get("/htmx.js", () => {
      const filepath = path.resolve(import.meta.dir, "../../../node_modules/htmx.org/dist/htmx.min.js")
      return Bun.file(filepath);
    })
    .get("/", () => {
      return (
        <BaseLayout>
          <p>Hello, world!</p>
        </BaseLayout>
      )
    })
}
