import { MatchPattern } from "wxt/utils/match-patterns";

export enum MessageType {
  getSessionARN = "getSessionARN",
  changeColor = "changeColor",
}

export const signinMatchPattern = "*://*.signin.aws.amazon.com/*";
export const sessionsSelectorMatchPattern: string =
  "*://*.signin.aws.amazon.com/sessions/selector*";

export function getMatches(): string[] {
  const matches = ["*://*.console.aws.amazon.com/*", signinMatchPattern];
  const { BROWSER, MODE } = import.meta.env;

  if (BROWSER === "chrome" && MODE === "development") {
    matches.push("file:///*");
  }

  return matches;
}

// Use the browser's match pattern semantics instead of a substring match,
// so that e.g. a query string containing an AWS domain does not match.
export function matchURL(matchPattern: string, url: string): boolean {
  try {
    return new MatchPattern(matchPattern).includes(url);
  } catch {
    // Invalid match pattern or URL
    return false;
  }
}
