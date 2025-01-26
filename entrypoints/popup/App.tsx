import type { Dispatch, SetStateAction } from "react";
import type { SafeParseReturnType } from "zod";
import { ColorPicker, ColorService, useColor } from "react-color-palette";
import { z } from "zod";
import {
  colorSettingsStorageItemKey,
  colorSettingsZodType,
  getColorSettingsFromStorage,
} from "@/modules/color_settings.ts";
import { matches, MessageType } from "@/modules/lib.ts";
import "react-color-palette/css";
import "./App.css";

type ColorSettingsType = z.TypeOf<typeof colorSettingsZodType>;
type SetHexColorType = (hc: string) => void;
type SetIndexType = Dispatch<SetStateAction<number>>;
type GetColorSettingsParamsType = {
  setColorSettings: Dispatch<SetStateAction<ColorSettingsType>>;
  setIndex: SetIndexType;
  setSessionARN: Dispatch<SetStateAction<string>>;
  setHexColor: SetHexColorType;
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
  setHexColor,
}: {
  index: number;
  hexColor: string;
  setIndex: SetIndexType;
  setHexColor: SetHexColorType;
}) {
  setIndex(index);
  setHexColor(hexColor);
}

async function setNewColorSettingState({
  colorSettings,
  setIndex,
  setSessionARN,
  setHexColor,
}: {
  colorSettings: ColorSettingsType;
  setIndex: SetIndexType;
  setSessionARN: Dispatch<SetStateAction<string>>;
  setHexColor: SetHexColorType;
}) {
  setColorSettingState({
    index: indexOfNewColorSetting,
    hexColor: defaultHexColor,
    setIndex,
    setHexColor,
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
  setHexColor,
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
      setHexColor,
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

  const filteredMatches = matches.filter((m) => {
    return new RegExp(m.replaceAll("*", ".*")).exec(
      z.string().parse(tabs[0].url),
    );
  });
  return 0 < filteredMatches.length
    ? await browser.tabs.sendMessage(z.number().parse(tabs[0].id), message)
    : undefined;
}

async function getSessionARNFromContentScript(): Promise<
  SafeParseReturnType<string, string>
> {
  return z
    .string()
    .safeParse(await sendMessageToContentScript(MessageType.getSessionARN));
}

function setExistColorSettingState({
  colorSettings,
  index,
  setIndex,
  setHexColor,
}: {
  colorSettings: ColorSettingsType;
  index: number;
  setIndex: SetIndexType;
  setHexColor: SetHexColorType;
}) {
  setColorSettingState({
    index: index,
    hexColor: colorSettings[index].hexColor,
    setIndex,
    setHexColor,
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
  const [color, setColor] = useColor(defaultHexColor);
  const setHexColor: SetHexColorType = (hc: string) => {
    setColor(ColorService.convert("hex", hc));
  };
  useEffect(() => {
    initialize({
      setColorSettings,
      setIndex,
      setSessionARN,
      setHexColor,
    });
  }, []);
  const isIndexOfNewColorSetting = index === indexOfNewColorSetting;
  return (
    <>
      <h1>AWS management console colorize</h1>
      <div className="card rcp-fields-floor">
        <div id="session-arn-field" className="rcp-field">
          <select
            id="session-arn-index"
            className="rcp-field-input"
            value={index}
            onChange={async ({ target: { value } }) => {
              await onChange({
                indexValue: value,
                colorSettings,
                getColorSettingsParams: {
                  setColorSettings,
                  setIndex,
                  setSessionARN,
                  setHexColor,
                },
              });
            }}
          >
            {colorSettings.map(({ sessionARN }, i) => (
              <option value={i}>{sessionARN}</option>
            ))}
            <option value={indexOfNewColorSetting}>[New]</option>
          </select>
          {isIndexOfNewColorSetting && (
            <input
              className="rcp-field-input"
              required={true}
              value={sessionARN}
              onChange={({ target: { value } }) => setSessionARN(value)}
            />
          )}
          <label htmlFor="session-arn-index" className="rcp-field-label">
            Session ARN
          </label>
        </div>
        <ColorPicker color={color} onChange={setColor} />
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
                  setHexColor,
                },
                hexColor: color.hex,
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
                await onUpdateButtonClick(color.hex, {
                  colorSettings,
                  getColorSettingsParams: {
                    setColorSettings,
                    setIndex,
                    setSessionARN,
                    setHexColor,
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
                    setHexColor,
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
