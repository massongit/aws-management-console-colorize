import type { Manifest } from "wxt/browser";

export enum MessageType {
  getSessionARN = "getSessionARN",
  changeColor = "changeColor",
}

export const signinMatchPattern = "*://*.signin.aws.amazon.com/*";
export const matches: Manifest.ContentScript["matches"] = [
  "*://*.console.aws.amazon.com/*",
  signinMatchPattern,
];
