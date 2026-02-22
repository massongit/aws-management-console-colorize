import type { ConfigEnv, UserManifest } from "wxt";
import { defineConfig } from "wxt";

function manifest(env: ConfigEnv): UserManifest {
  return {
    name: "AWS management console colorize",
    permissions: ["storage", "tabs"],
    // Keep a consistent extension ID when we test a Chrome extension
    // https://developer.chrome.com/docs/extensions/reference/manifest/key#keep-consistent-id
    key:
      env.browser === "chrome" && env.mode === "development"
        ? "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAymfEG5CObAVip4I5oUGfiHeNvHGPS8k7t+ziYyQ2+8IwPaQP+uuGqd+aq3Fo4Hv9a/pzB34vnqHGVWfsSBizE3cOf8U64VmPN7BSldcFISbGT9yn/EH+N7MWpAVbJa7I4SAQiiyjg3oTGpfNVI/a/lfB5TiQBg5StYtvDyftoCMRDVosm4kQ9CJEPphxWCBASSH5vorzkY/ys3xw+Pcu6P8SV+D6/Se9OHV0IVogvLEpSECcTH0tFRGZMAhVGsQzqgJIxca/TW/G3+r2vaJCExBRg9HmOiyF297WrooHLa5RInyJW6Wdg30GiZOCOqI2rU0PedUQrvGBGOxrU0XTawIDAQAB"
        : undefined,
    browser_specific_settings:
      env.browser === "firefox"
        ? {
            gecko: {
              id: "{f5ee4589-0248-4dad-b389-8a206e0a0b7c}",

              // https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
              // TODO: Remove next line once WXT supports data_collection_permissions
              // @ts-expect-error WXT types don't include data_collection_permissions yet
              data_collection_permissions: {
                required: ["none"],
              },
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
