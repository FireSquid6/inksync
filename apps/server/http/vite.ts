// copied from timnghg/elysia-vite
import { Elysia } from "elysia";
import type { UserConfig } from "vite";
import * as path from "path";

export type ViteConfig = UserConfig & {
  appRootPath?: string;
  viteConfigFilePath?: string;
  placeHolderDevScripts?: string;
  isReact?: boolean;
  entryClientFile?: string;
  entryHtmlFile?: string;
};

export const elysiaViteConfig =
  <C extends ViteConfig>(config?: C) =>
    (app: Elysia) => {
      return app.derive(function() {
        return {
          async viteConfig(): Promise<C> {
            return (await getViteConfig(config)) as C;
          },
        };
      });
    };

export const elysiaVite = <C extends ViteConfig>(options?: C) => {
  console.log("Calling the elysia vite plugin");
  return new Elysia({
    name: "elysia-vite",
    seed: options,
  })
    .use(elysiaViteConfig(options))
    .get("/admin", async (ctx) => {
      console.log("Using the elysia vite handler");
      ctx.set.headers["Content-Type"] = "text/html;charset=utf-8";

      const viteConfig = await ctx.viteConfig();
      const vitePort = viteConfig?.server?.port || 5173;
      const viteHost = viteConfig?.server?.host || "localhost";
      const viteUrl = `http://${viteHost}:${vitePort}`;
      const entryClientFile =
        options?.entryClientFile || "entry-client.tsx";
      const entryHtmlFile =
        options?.entryHtmlFile ||
        path.resolve(
          options?.appRootPath ||
          options?.root ||
          import.meta.dir,
          "index.html"
        );
      const htmlFile = Bun.file(entryHtmlFile);
      if (!(await htmlFile.exists())) {
        console.error(
          `[elysia-vite] not found! entryHtmlFile=${entryHtmlFile} root=${viteConfig.root}`
        );
        ctx.set.status = 404;
        return "NOT_FOUND";
      }
      const html = await htmlFile.text();
      let viteScripts = `<script type="module" src="${viteUrl}/@vite/client"></script>
<script type="module" src="${viteUrl}/${entryClientFile}"></script>`;

      // @see https://vitejs.dev/guide/backend-integration.html
      if (options?.isReact) {
        viteScripts =
          `<script type="module">
import RefreshRuntime from '${viteUrl}/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>` + viteScripts;
      }

      return html.replace(
        options?.placeHolderDevScripts || "<!--vite-dev-scripts-->",
        viteScripts
      );
    })
};

export async function getViteConfig<C extends ViteConfig>(config?: C) {
  const viteConfigPath =
    config?.viteConfigFilePath ||
    `${config?.appRootPath}/vite.config.ts` ||
    `${import.meta.dir}/vite.config.ts`;

  const viteConfigFile = viteConfigPath ? Bun.file(viteConfigPath) : null;

  if (viteConfigPath && (await viteConfigFile?.exists())) {
    const viteConfig = import.meta.require(viteConfigPath);
    config = {
      ...viteConfig?.default,
      ...config,
    };
  }

  return config as C;
}
