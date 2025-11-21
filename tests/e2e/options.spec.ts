import {
  add2SessionARNs,
  addSessionARN,
  checkAddedSessionARNState,
  checkAWSPagesChanged,
  checkAWSPagesNotChanged,
  checkInitializeState,
  expect,
  expectSessionARN,
  extensionTest,
  getTestData,
} from "./fixtures";

extensionTest("options: add a sessionARN", async ({ page }) => {
  const testData = getTestData(page);

  await addSessionARN({ ...testData, page, url: testData.optionsURL });

  await expect(testData.hexColorInput).toHaveValue(testData.hexColor);
  await expectSessionARN({
    ...testData,
    sessionARNIndex: 0,
  });
  await checkAddedSessionARNState(testData);
  await checkAWSPagesChanged({
    page,
    sessionARNIndex: 0,
    hexColor: testData.hexColor,
  });
});

extensionTest("options: add 2 sessionARNs", async ({ page }) => {
  const testData = getTestData(page);

  await add2SessionARNs({ ...testData, page, url: testData.optionsURL });

  const sessionARNIndex = 1;
  await expectSessionARN({
    ...testData,
    sessionARNIndex,
    sessionARN: testData.secondSessionARN,
  });
  await expect(testData.hexColorInput).toHaveValue(testData.secondHexColor);
  await checkAddedSessionARNState(testData);
  await checkAWSPagesChanged({
    page,
    sessionARNIndex,
    hexColor: testData.secondHexColor,
  });
});

extensionTest(
  "options: add 2 sessionARNs and delete a sessionARN",
  async ({ page }) => {
    const testData = getTestData(page);

    await add2SessionARNs({ ...testData, page, url: testData.optionsURL });

    await testData.deleteButton.click();

    await expect(testData.hexColorInput).toHaveValue(testData.hexColor);
    await expectSessionARN({
      ...testData,
      sessionARNIndex: 0,
    });
    await checkAddedSessionARNState(testData);
    await checkAWSPagesNotChanged(page, 1);
  },
);

extensionTest("options: update a sessionARN", async ({ page }) => {
  const testData = getTestData(page);

  await addSessionARN({ ...testData, page, url: testData.optionsURL });

  await testData.hexColorInput.fill(testData.secondHexColor);

  await testData.updateButton.click();

  await expect(testData.hexColorInput).toHaveValue(testData.secondHexColor);
  await expectSessionARN({
    ...testData,
    sessionARNIndex: 0,
  });
  await checkAddedSessionARNState(testData);
  await checkAWSPagesChanged({
    page,
    sessionARNIndex: 0,
    hexColor: testData.secondHexColor,
  });
});

extensionTest("options: delete a sessionARN", async ({ page }) => {
  const testData = getTestData(page);

  await addSessionARN({ ...testData, page, url: testData.optionsURL });

  await testData.deleteButton.click();

  await expect(testData.newSessionARNInput).toBeEditable();
  await checkInitializeState(testData);
  await checkAWSPagesNotChanged(page, 0);
});
