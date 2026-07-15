import {
  writeFiles,
  writeImage,
  writeText,
} from "tauri-plugin-clipboard-x-api";
import { clipboardStore } from "@/stores/clipboard";
import { ignoreNextClipboardChange } from "@/stores/clipboardRuntime";
import type { DatabaseSchemaHistory } from "@/types/database";
import { wait } from "@/utils/shared";
import { paste } from "./paste";

export const writeToClipboard = (data: DatabaseSchemaHistory) => {
  const { type, value } = data;

  ignoreNextClipboardChange();

  switch (type) {
    case "text":
      return writeText(value);
    case "image":
      return writeImage(value);
    case "files":
      return writeFiles(value);
  }
};

export const pasteToClipboard = async (
  data: DatabaseSchemaHistory,
  asPlain?: boolean,
) => {
  const { type, value, search } = data;
  const { pastePlain } = clipboardStore.content;
  const shouldPasteAsPlain =
    asPlain === true || (asPlain == null && pastePlain && type === "text");
  const shouldWaitForClipboardSettled =
    type === "image" || (type === "files" && !shouldPasteAsPlain);

  if (shouldPasteAsPlain) {
    if (type === "files") {
      ignoreNextClipboardChange();
      await writeText(value.join("\n"));
    } else if (type === "text") {
      ignoreNextClipboardChange();
      await writeText(search);
    } else {
      await writeToClipboard(data);
    }
  } else {
    await writeToClipboard(data);
  }

  if (shouldWaitForClipboardSettled) {
    // Give Windows a moment to publish binary clipboard payloads before Ctrl+V.
    await wait(120);
  }

  return paste();
};
