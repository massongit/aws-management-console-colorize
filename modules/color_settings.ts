import type { StorageItemKey } from "#imports";
import { z } from "zod";

export const colorSettingZodType = z.object({
  sessionARN: z.string(),
  hexColor: z.string().regex(/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i),
});
export const colorSettingsZodType = z.array(colorSettingZodType);
export const colorSettingsStorageItemKey: StorageItemKey = "sync:colorSettings";

export type ColorSettingType = z.infer<typeof colorSettingZodType>;
export type ColorSettingsType = z.infer<typeof colorSettingsZodType>;

// Synced storage can be written from any of the user's devices,
// so drop invalid entries instead of trusting the stored value.
export function parseColorSettings(value: unknown): ColorSettingsType | null {
  const result = z.array(z.unknown()).safeParse(value);

  if (!result.success) {
    return null;
  }

  return result.data.flatMap((v: unknown): ColorSettingsType => {
    const colorSetting = colorSettingZodType.safeParse(v);
    return colorSetting.success ? [colorSetting.data] : [];
  });
}

export async function getColorSettingsFromStorage(): Promise<ColorSettingsType | null> {
  return parseColorSettings(await storage.getItem(colorSettingsStorageItemKey));
}
