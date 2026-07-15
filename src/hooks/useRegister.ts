import {
  isRegistered,
  register,
  type ShortcutHandler,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { error as logError } from "@tauri-apps/plugin-log";
import { useAsyncEffect, useUnmount } from "ahooks";
import { castArray } from "es-toolkit/compat";
import { useState } from "react";

const normalizeShortcut = (shortcut?: string) => {
  if (!shortcut) return shortcut;

  return shortcut
    .split("+")
    .map((segment) => {
      const key = segment.trim();
      const lower = key.toLowerCase();

      switch (lower) {
        case "command":
          return "super";
        case "control":
          return "ctrl";
        case "escape":
          return "esc";
        default:
          return key.length === 1 ? lower : lower;
      }
    })
    .join("+");
};

const normalizeShortcuts = (shortcuts?: string | string[]) => {
  if (!shortcuts) return shortcuts;

  return castArray(shortcuts).map((shortcut) => normalizeShortcut(shortcut)!);
};

export const useRegister = (
  handler: ShortcutHandler,
  deps: Array<string | string[] | undefined>,
) => {
  const [oldShortcuts, setOldShortcuts] = useState(deps[0]);

  useAsyncEffect(async () => {
    const [shortcuts] = deps;
    const nextShortcuts = normalizeShortcuts(shortcuts);
    const previousShortcuts = normalizeShortcuts(oldShortcuts);

    for await (const shortcut of castArray(previousShortcuts)) {
      if (!shortcut) continue;

      const registered = await isRegistered(shortcut);

      if (registered) {
        await unregister(shortcut);
      }
    }

    if (!nextShortcuts) return;

    try {
      await register(nextShortcuts, (event) => {
        if (event.state === "Released") return;

        handler(event);
      });
    } catch (error) {
      await logError(
        `Failed to register global shortcut ${JSON.stringify(nextShortcuts)}: ${String(error)}`,
      );
      return;
    }

    setOldShortcuts(shortcuts);
  }, deps);

  useUnmount(() => {
    const [shortcuts] = deps;
    const nextShortcuts = normalizeShortcuts(shortcuts);

    if (!nextShortcuts) return;

    unregister(nextShortcuts);
  });
};
