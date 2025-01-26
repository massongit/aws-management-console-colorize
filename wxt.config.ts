import type { ConfigEnv, UserManifest } from "wxt";
import { defineConfig } from "wxt";

function manifest(env: ConfigEnv): UserManifest {
  return {
    name: "AWS management console colorize",
    permissions: ["storage", "tabs"],
    // Setting a temporary extension ID to use storage when we develop a Firefox extension
    // https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
    browser_specific_settings:
      env.browser === "firefox" && env.mode === "development"
        ? {
            gecko: {
              id: "aws-management-console-colorize@example.org",
            },
          }
        : undefined,
  };
}

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  manifest,
});
