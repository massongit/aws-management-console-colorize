import type { BrowserContext, Locator, Page } from "@playwright/test";
import path from "path";
import { chromium, test } from "@playwright/test";

type checkInitializeStateParams = {
  sessionARNsSelect: Locator;
  sessionARNIndex: number;
  newSessionARN: string;
  hexColorInput: Locator;
  addButton: Locator;
  updateButton: Locator;
  deleteButton: Locator;
};

type addSessionARNParams = {
  secondSessionARN: string;
  secondHexColor: string;
  newSessionARNInput: Locator;
  sessionARN: string;
  hexColor: string;
} & checkInitializeStateParams;

export const extensionTest = test.extend<{
  context: BrowserContext;
}>({
  context: async ({ context }, use: (r: BrowserContext) => Promise<void>) => {
    context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${path.resolve("dist/chrome-mv3-dev")}`,
      ],
    });
    await use(context);
    await context.close();
  },
});
export const expect = extensionTest.expect;

export function getTestData(
  page: Page,
): { popupURL: string; optionsURL: string } & addSessionARNParams {
  const extensionID = "ihllnndjleheembkonidbocncnnedhcf";
  return {
    popupURL: `chrome-extension://${extensionID}/popup.html`,
    optionsURL: `chrome-extension://${extensionID}/options.html`,
    sessionARNsSelect: page.getByLabel("Session ARN"),
    sessionARNIndex: -1,
    newSessionARN: "[New]",
    sessionARN: "arn:aws:iam::123456789010:user/test_user0",
    secondSessionARN: "arn:aws:iam::123456789011:user/test_user1",
    hexColorInput: page.getByLabel("HEX"),
    addButton: page.getByText("Add"),
    updateButton: page.getByText("Update"),
    deleteButton: page.getByText("Delete"),
    newSessionARNInput: page.getByPlaceholder(
      "arn:aws:iam::012345678901:user/user_name",
    ),
    hexColor: "#987650",
    secondHexColor: "#987651",
  };
}

export async function expectSessionARN({
  sessionARNsSelect,
  sessionARNIndex,
  sessionARN,
}: {
  sessionARNsSelect: Locator;
  sessionARNIndex: number;
  sessionARN: string;
}): Promise<void> {
  await expect(sessionARNsSelect).toHaveValue(sessionARNIndex.toString());
  await expect(
    sessionARNsSelect.locator(`option[value="${sessionARNIndex}"]`),
  ).toHaveText(sessionARN);
}

export async function checkInitializeState(
  testData: checkInitializeStateParams,
): Promise<void> {
  await expectSessionARN({ ...testData, sessionARN: testData.newSessionARN });
  await expect(testData.hexColorInput).toHaveValue("#161d26");
  await expect(testData.addButton).toBeDisabled();
  await expect(testData.updateButton).toBeHidden();
  await expect(testData.deleteButton).toBeHidden();
}

export async function addSessionARN(
  testData: { page: Page; url: string } & addSessionARNParams,
): Promise<void> {
  await testData.page.goto(testData.url);

  await checkInitializeState(testData);

  await testData.newSessionARNInput.fill(testData.sessionARN);

  await testData.hexColorInput.fill(testData.hexColor);

  await testData.addButton.click();
}

export async function checkAddedSessionARNState({
  newSessionARNInput,
  addButton,
  updateButton,
  deleteButton,
}: {
  newSessionARNInput: Locator;
  addButton: Locator;
  updateButton: Locator;
  deleteButton: Locator;
}): Promise<void> {
  await expect(newSessionARNInput).toBeHidden();
  await expect(addButton).toBeHidden();
  await expect(updateButton).toBeEnabled();
  await expect(deleteButton).toBeEnabled();
}

export async function add2SessionARNs(
  testData: { page: Page; url: string } & addSessionARNParams,
): Promise<void> {
  await addSessionARN(testData);

  await testData.sessionARNsSelect.selectOption(
    testData.sessionARNIndex.toString(),
  );

  await expectSessionARN({ ...testData, sessionARN: testData.newSessionARN });

  await testData.newSessionARNInput.fill(testData.secondSessionARN);

  await testData.hexColorInput.fill(testData.secondHexColor);

  await testData.addButton.click();
}

async function checkAWSConsolePage({
  page,
  sessionARNIndex,
  rgbColor,
}: {
  page: Page;
  sessionARNIndex: number;
  rgbColor: string;
}): Promise<void> {
  await page.goto(
    `file://${path.resolve(`tests/e2e/html/console${sessionARNIndex}.html`)}`,
  );

  const locators = [
    page
      .locator("#consoleNavHeader")
      .getByTestId("awsc-nav-header")
      .getByLabel("Global"),
    page.getByTestId("awsc-nav-footer"),
  ];

  for (const locator of locators) {
    expect(
      await locator.evaluate(
        ({ style: { backgroundColor } }) => backgroundColor,
      ),
    ).toEqual(rgbColor);
  }
}

async function goToAWSSessionSelectorPage(page: Page): Promise<void> {
  await page.goto(
    `file://${path.resolve("tests/e2e/html/sessions/selector.html")}`,
  );
}

export async function checkAWSPagesChanged({
  page,
  sessionARNIndex,
  hexColor,
}: {
  page: Page;
  sessionARNIndex: number;
  hexColor: string;
}): Promise<void> {
  const red = parseInt(hexColor.substring(1, 3), 16);
  const green = parseInt(hexColor.substring(3, 5), 16);
  const blue = parseInt(hexColor.substring(5, 7), 16);
  const rgbColor = `rgb(${red}, ${green}, ${blue})`;
  await checkAWSConsolePage({ page, sessionARNIndex, rgbColor });

  await goToAWSSessionSelectorPage(page);

  const awsUIRestorePointerEvents = page
    .locator("div[class^='awsui_restore-pointer-events']")
    .nth(sessionARNIndex);
  expect(
    await awsUIRestorePointerEvents.evaluate(
      ({ style: { display } }) => display,
    ),
  ).toEqual("flex");
  expect(
    await awsUIRestorePointerEvents.evaluate(
      ({ style: { justifyContent } }) => justifyContent,
    ),
  ).toEqual("space-between");

  const { backgroundColor, width } = await page
    .getByTitle(
      `The color of arn:aws:iam::12345678901${sessionARNIndex}:user/test_user${sessionARNIndex}`,
    )
    .evaluate(({ style }) => style);
  expect(backgroundColor).toEqual(rgbColor);
  expect(width).toEqual(
    `${await awsUIRestorePointerEvents.evaluate(({ clientHeight }) => clientHeight)}px`,
  );
}

export async function checkAWSPagesNotChanged(
  page: Page,
  sessionARNIndex: number,
): Promise<void> {
  await checkAWSConsolePage({ page, sessionARNIndex, rgbColor: "" });

  await goToAWSSessionSelectorPage(page);

  const awsUIRestorePointerEvents = page
    .locator("div[class^='awsui_restore-pointer-events']")
    .nth(sessionARNIndex);
  const styles = [
    await awsUIRestorePointerEvents.evaluate(
      ({ style: { display } }) => display,
    ),
    await awsUIRestorePointerEvents.evaluate(
      ({ style: { justifyContent } }) => justifyContent,
    ),
  ];

  for (const style of styles) {
    expect(style).toEqual("");
  }

  await expect(
    page.getByTitle(
      `The color of arn:aws:iam::123456789012:user/test_user${sessionARNIndex}`,
    ),
  ).toBeHidden();
}
