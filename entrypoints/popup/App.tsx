import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ZodSafeParseResult } from "zod";
import { browser, storage, useEffect, useState } from "#imports";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { z } from "zod";
import {
  colorSettingsStorageItemKey,
  colorSettingsZodType,
  getColorSettingsFromStorage,
} from "@/modules/color_settings.ts";
import { getMatches, MessageType, matchURL } from "@/modules/lib.ts";
import "./App.css";

type ColorSettingsType = z.TypeOf<typeof colorSettingsZodType>;
type SetHexColorType = (hc: string) => void;
type SetIndexType = Dispatch<SetStateAction<number>>;
type GetColorSettingsParamsType = {
  setColorSettings: Dispatch<SetStateAction<ColorSettingsType>>;
  setIndex: SetIndexType;
  setSessionARN: Dispatch<SetStateAction<string>>;
  setColor: SetHexColorType;
};
type SetColorSettingParamsType = {
  colorSettings: ColorSettingsType;
  index: number;
  getColorSettingsParams: GetColorSettingsParamsType;
};

const indexOfNewColorSetting = -1;
const defaultHexColor = "#161d26";

function setColorSettingState({
  index,
  hexColor,
  setIndex,
  setColor,
}: {
  index: number;
  hexColor: string;
  setIndex: SetIndexType;
  setColor: SetHexColorType;
}) {
  setIndex(index);
  setColor(hexColor);
}

async function setNewColorSettingState({
  colorSettings,
  setIndex,
  setSessionARN,
  setColor,
}: {
  colorSettings: ColorSettingsType;
  setIndex: SetIndexType;
  setSessionARN: Dispatch<SetStateAction<string>>;
  setColor: SetHexColorType;
}) {
  setColorSettingState({
    index: indexOfNewColorSetting,
    hexColor: defaultHexColor,
    setIndex,
    setColor,
  });
  const { success, data } = await getSessionARNFromContentScript();

  if (!success) {
    return;
  }

  if (colorSettings.findIndex(({ sessionARN }) => sessionARN === data) < 0) {
    setSessionARN(data);
  }
}

async function getColorSettings({
  setColorSettings,
  setIndex,
  setSessionARN,
  setColor,
}: GetColorSettingsParamsType): Promise<ColorSettingsType> {
  const colorSettings = await getColorSettingsFromStorage();
  const fixedColorSettings =
    colorSettings !== null && 0 < colorSettings.length ? colorSettings : [];

  if (0 < fixedColorSettings.length) {
    setColorSettings(fixedColorSettings);
  } else {
    await setNewColorSettingState({
      colorSettings: fixedColorSettings,
      setIndex,
      setSessionARN,
      setColor,
    });
  }

  return fixedColorSettings;
}

async function sendMessageToContentScript(
  message: MessageType,
): Promise<unknown> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error("Can't get tabs");
  }

  const tab = tabs[0];

  if (tab === undefined) {
    throw new Error("Can't get a tab");
  }

  const filteredMatches = getMatches().filter((m) => {
    return matchURL(m, z.string().parse(tab.url));
  });
  return 0 < filteredMatches.length
    ? await browser.tabs.sendMessage(z.number().parse(tab.id), message)
    : undefined;
}

async function getSessionARNFromContentScript(): Promise<
  ZodSafeParseResult<string>
> {
  return z
    .string()
    .safeParse(await sendMessageToContentScript(MessageType.getSessionARN));
}

function setExistColorSettingState({
  colorSettings,
  index,
  setIndex,
  setColor,
}: {
  colorSettings: ColorSettingsType;
  index: number;
  setIndex: SetIndexType;
  setColor: SetHexColorType;
}) {
  const colorSetting = colorSettings[index];

  if (colorSetting === undefined) {
    throw new Error("Can't get a colorSetting");
  }

  setColorSettingState({
    index: index,
    hexColor: colorSetting.hexColor,
    setIndex,
    setColor,
  });
}

async function initialize(getColorSettingsParams: GetColorSettingsParamsType) {
  const colorSettings = await getColorSettings(getColorSettingsParams);
  const { success, data } = await getSessionARNFromContentScript();

  if (!success) {
    if (0 < colorSettings.length) {
      setExistColorSettingState({
        ...getColorSettingsParams,
        colorSettings,
        index: 0,
      });
    }
    return;
  }

  const index = colorSettings.findIndex(
    ({ sessionARN }) => sessionARN === data,
  );

  if (index < 0) {
    getColorSettingsParams.setSessionARN(data);
    return;
  }

  setExistColorSettingState({
    ...getColorSettingsParams,
    colorSettings,
    index,
  });
}

async function onChange({
  colorSettings,
  indexValue,
  getColorSettingsParams,
}: {
  colorSettings: ColorSettingsType;
  indexValue: string;
  getColorSettingsParams: GetColorSettingsParamsType;
}) {
  const index = Number.parseInt(indexValue, 10);
  if (index === indexOfNewColorSetting) {
    await setNewColorSettingState({
      ...getColorSettingsParams,
      colorSettings,
    });
  } else if (-1 < index && index < colorSettings.length) {
    setExistColorSettingState({
      ...getColorSettingsParams,
      colorSettings,
      index,
    });
  }
}

async function setColorSetting({
  colorSettings,
  index,
  getColorSettingsParams,
}: SetColorSettingParamsType) {
  await storage.setItem(colorSettingsStorageItemKey, colorSettings);
  await sendMessageToContentScript(MessageType.changeColor);
  const newColorSettings = await getColorSettings(getColorSettingsParams);
  getColorSettingsParams.setColorSettings(newColorSettings);

  if (newColorSettings.length === 0) {
    return;
  }

  const fixedIndex = Math.min(index, newColorSettings.length - 1);
  setExistColorSettingState({
    ...getColorSettingsParams,
    colorSettings: newColorSettings,
    index: fixedIndex,
  });
}

async function onAddButtonClick({
  colorSettings,
  sessionARN,
  hexColor,
  getColorSettingsParams,
}: {
  colorSettings: ColorSettingsType;
  sessionARN: string;
  hexColor: string;
  getColorSettingsParams: GetColorSettingsParamsType;
}) {
  const newColorSettings = colorSettings.concat({ sessionARN, hexColor });
  getColorSettingsParams.setSessionARN("");
  await setColorSetting({
    getColorSettingsParams,
    colorSettings: newColorSettings,
    index: newColorSettings.length - 1,
  });
}

async function onUpdateButtonClick(
  hexColor: string,
  setColorSettingParams: SetColorSettingParamsType,
) {
  await setColorSetting({
    ...setColorSettingParams,
    colorSettings: setColorSettingParams.colorSettings.map(
      (colorSetting, i) => {
        if (i === setColorSettingParams.index) {
          colorSetting.hexColor = hexColor;
        }

        return colorSetting;
      },
    ),
  });
}

function App() {
  const [colorSettings, setColorSettings] = useState<ColorSettingsType>([]);
  const [index, setIndex] = useState(indexOfNewColorSetting);
  const [sessionARN, setSessionARN] = useState("");
  const [color, setColor] = useState(defaultHexColor);
  useEffect(() => {
    initialize({
      setColorSettings,
      setIndex,
      setSessionARN,
      setColor,
    });
  }, []);
  const isIndexOfNewColorSetting = index === indexOfNewColorSetting;
  return (
    <>
      <h1>AWS management console colorize</h1>
      <div className="card fields-floor">
        <div id="session-arn-field" className="field">
          <select
            id="session-arn-index"
            className="field-input"
            value={index}
            onChange={async ({ target: { value } }) => {
              await onChange({
                indexValue: value,
                colorSettings,
                getColorSettingsParams: {
                  setColorSettings,
                  setIndex,
                  setSessionARN,
                  setColor,
                },
              });
            }}
          >
            {colorSettings.map(({ sessionARN }, i) => (
              <option key={i} value={i}>
                {sessionARN}
              </option>
            ))}
            <option value={indexOfNewColorSetting}>[New]</option>
          </select>
          {isIndexOfNewColorSetting && (
            <input
              className="field-input"
              placeholder="arn:aws:iam::012345678901:user/user_name"
              required={true}
              value={sessionARN}
              onChange={({ target: { value } }) => setSessionARN(value)}
            />
          )}
          <label htmlFor="session-arn-index" className="field-label">
            Session ARN
          </label>
        </div>
        <div id="hex-color-field" className="field">
          <HexColorPicker color={color} onChange={setColor} />
          <HexColorInput
            id="hex-color-input"
            className="field-input"
            color={color}
            onChange={setColor}
            prefixed={true}
          />
          <label htmlFor="hex-color-input" className="field-label">
            HEX
          </label>
        </div>
        {isIndexOfNewColorSetting && (
          <button
            disabled={sessionARN === ""}
            onClick={async () => {
              await onAddButtonClick({
                colorSettings,
                getColorSettingsParams: {
                  setColorSettings,
                  setIndex,
                  setSessionARN,
                  setColor,
                },
                hexColor: color,
                sessionARN,
              });
            }}
          >
            Add
          </button>
        )}
        {-1 < index && index < colorSettings.length && (
          <>
            <button
              onClick={async () => {
                await onUpdateButtonClick(color, {
                  colorSettings,
                  getColorSettingsParams: {
                    setColorSettings,
                    setIndex,
                    setSessionARN,
                    setColor,
                  },
                  index,
                });
              }}
            >
              Update
            </button>
            <button
              onClick={async () => {
                await setColorSetting({
                  colorSettings: colorSettings.filter((_, i) => i !== index),
                  getColorSettingsParams: {
                    setColorSettings,
                    setIndex,
                    setSessionARN,
                    setColor,
                  },
                  index,
                });
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default App;
