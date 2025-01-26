import type { Manifest } from "wxt/browser";

export enum MessageType {
  getSessionARN = "getSessionARN",
  changeColor = "changeColor",
}

export const matches: Manifest.ContentScript["matches"] = [
  "*://*.console.aws.amazon.com/*",
];
