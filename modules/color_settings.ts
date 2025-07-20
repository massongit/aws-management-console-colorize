import type { StorageItemKey } from "#imports";
import { z } from "zod";

export const colorSettingZodType = z.object({
  sessionARN: z.string(),
  hexColor: z.string(),
});
export const colorSettingsZodType = z.array(colorSettingZodType);
export const colorSettingsStorageItemKey: StorageItemKey = "sync:colorSettings";

export async function getColorSettingsFromStorage(): Promise<z.TypeOf<
  typeof colorSettingsZodType
> | null> {
  return await storage.getItem(colorSettingsStorageItemKey);
}
