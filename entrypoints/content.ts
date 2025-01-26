import { z } from "zod";
import { getColorSettingsFromStorage } from "@/modules/color_settings.ts";
import { matches, MessageType } from "@/modules/lib.ts";

type GetHTMLElementType = () => HTMLElement | null;

function runChangeBackgroundColor(
  color: string,
  getElement: GetHTMLElementType,
): boolean {
  const element = getElement();

  if (element === null) {
    return false;
  }

  element.style.backgroundColor = color;
  return true;
}

async function changeColor(sessionARN: string) {
  const colorSettings = await getColorSettingsFromStorage();
  const colorSetting = colorSettings?.find((c) => {
    return c.sessionARN === sessionARN;
  });
  const hexColor = colorSetting?.hexColor ?? "";
  const mutationObserverConfigs: {
    getElement: GetHTMLElementType;
    mutationObserveTargetID: string;
  }[] = [
    {
      getElement: () => {
        return document.querySelector(
          "#consoleNavHeader #awsc-nav-header > nav",
        );
      },
      mutationObserveTargetID: "consoleNavHeader",
    },
    {
      getElement: () => document.getElementById("console-nav-footer-inner"),
      mutationObserveTargetID: "console-nav-footer",
    },
  ];

  for (const c of mutationObserverConfigs) {
    if (runChangeBackgroundColor(hexColor, c.getElement)) {
      continue;
    }

    const mutationObserveTarget = document.getElementById(
      c.mutationObserveTargetID,
    );

    if (mutationObserveTarget === null) {
      throw new Error(`Can't get ${c.mutationObserveTargetID}`);
    }

    new MutationObserver((_, observer) => {
      if (runChangeBackgroundColor(hexColor, c.getElement)) {
        observer.disconnect();
      }
    }).observe(mutationObserveTarget, { childList: true });
  }
}

async function onMessage(
  sessionARN: string,
  message: MessageType,
): Promise<string | undefined> {
  switch (message) {
    case MessageType.getSessionARN:
      return sessionARN;
    case MessageType.changeColor:
      await changeColor(sessionARN);
      return;
    default:
      throw new Error(`Incorrect message ${message}`);
  }
}

async function main() {
  const awscSessionData = document.querySelector(
    'meta[name="awsc-session-data"]',
  );

  if (!(awscSessionData instanceof HTMLMetaElement)) {
    throw new Error("Can't get awsc-session-data");
  }

  const sessionARN = z
    .object({ sessionARN: z.string() })
    .parse(JSON.parse(awscSessionData.content)).sessionARN;
  browser.runtime.onMessage.addListener(async (message) => {
    return await onMessage(
      sessionARN,
      MessageType[message as keyof typeof MessageType],
    );
  });
  await changeColor(sessionARN);
}

export default defineContentScript({ matches, main });
