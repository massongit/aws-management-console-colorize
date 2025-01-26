import type { StorageItemKey } from "@wxt-dev/storage";
import { z } from "zod";

export const colorSettingsZodType = z.array(
  z.object({
    sessionARN: z.string(),
    hexColor: z.string(),
  }),
);
const nullableColorSettingsZodType = colorSettingsZodType.nullable();
export const colorSettingsStorageItemKey: StorageItemKey = "sync:colorSettings";

export async function getColorSettingsFromStorage(): Promise<
  z.TypeOf<typeof nullableColorSettingsZodType>
> {
  return await storage.getItem(colorSettingsStorageItemKey);
}
