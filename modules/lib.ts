import type { Manifest } from "wxt/browser";

export enum MessageType {
  getSessionARN = "getSessionARN",
  changeColor = "changeColor",
}

export const signinMatchPattern = "*://*.signin.aws.amazon.com/*";

export function getMatches(): Manifest.ContentScript["matches"] {
  const matches: Manifest.ContentScript["matches"] = [
    "*://*.console.aws.amazon.com/*",
    signinMatchPattern,
  ];
  const { BROWSER, MODE } = import.meta.env;

  if (BROWSER === "chrome" && MODE === "development") {
    matches.push("file://*");
  }

  return matches;
}

export function matchURL(matchPattern: string, url: string): boolean {
  return new RegExp(matchPattern.replaceAll("*", ".*")).exec(url) !== null;
}
