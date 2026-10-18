import { expect, test } from "@playwright/test";
import {
  type ColorSettingType,
  type ColorSettingsType,
  parseColorSettings,
} from "@/modules/color_settings.ts";
import {
  matchURL,
  sessionsSelectorMatchPattern,
  signinMatchPattern,
} from "@/modules/lib.ts";

const consoleMatchPattern = "*://*.console.aws.amazon.com/*";

test("matchURL: matches AWS console URLs", () => {
  expect(
    matchURL(
      consoleMatchPattern,
      "https://us-east-1.console.aws.amazon.com/console/home",
    ),
  ).toBe(true);
  expect(
    matchURL(
      sessionsSelectorMatchPattern,
      "https://us-east-1.signin.aws.amazon.com/sessions/selector?region=us-east-1",
    ),
  ).toBe(true);
  expect(matchURL("file:///*", "file:///tmp/console0.html")).toBe(true);
});

test("matchURL: rejects URLs that only contain an AWS domain", () => {
  for (const url of [
    "https://evil.example/?q=.console.aws.amazon.com/",
    "https://evil.example/https://x.console.aws.amazon.com/",
    "https://x.console.aws.amazon.com.evil.example/",
    "https://xconsole.aws.amazon.com/",
    "ftp://x.console.aws.amazon.com/",
    "file:///x.console.aws.amazon.com/",
    "not a url",
  ]) {
    expect(matchURL(consoleMatchPattern, url), url).toBe(false);
  }

  expect(matchURL("file:///*", "https://x.console.aws.amazon.com/")).toBe(
    false,
  );
});

test("matchURL: does not treat a console page as the sessions selector", () => {
  for (const matchPattern of [
    signinMatchPattern,
    sessionsSelectorMatchPattern,
  ]) {
    expect(
      matchURL(
        matchPattern,
        "https://us-east-1.console.aws.amazon.com/?q=.signin.aws.amazon.com/sessions/selector",
      ),
    ).toBe(false);
  }
});

test("parseColorSettings: keeps valid color settings", () => {
  const colorSettings: ColorSettingsType = [
    { sessionARN: "arn:aws:iam::123456789010:user/a", hexColor: "#161d26" },
    { sessionARN: "arn:aws:iam::123456789011:user/b", hexColor: "#16BD2680" },
  ];
  expect(parseColorSettings(colorSettings)).toEqual(colorSettings);
});

test("parseColorSettings: drops crafted color settings", () => {
  const valid: ColorSettingType = {
    sessionARN: "arn:aws:iam::123456789010:user/a",
    hexColor: "#161d26",
  };
  expect(
    parseColorSettings([
      valid,
      { sessionARN: "arn:aws:iam::123456789011:user/b", hexColor: "red" },
      {
        sessionARN: "arn:aws:iam::123456789012:user/c",
        hexColor: "#000; background-image: url(https://evil.example/)",
      },
      { sessionARN: 1, hexColor: "#161d26" },
      { hexColor: "#161d26" },
      "#161d26",
      null,
    ]),
  ).toEqual([valid]);
});

test("parseColorSettings: returns null for a value that is not an array", () => {
  for (const value of [null, undefined, "x", 1, { sessionARN: "x" }]) {
    expect(parseColorSettings(value)).toBeNull();
  }
});
