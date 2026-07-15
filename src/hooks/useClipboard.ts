import { useMount } from "ahooks";
import { cloneDeep } from "es-toolkit";
import { isEmpty, remove } from "es-toolkit/compat";
import { nanoid } from "nanoid";
import {
  type ClipboardChangeOptions,
  onClipboardChange,
  startListening,
} from "tauri-plugin-clipboard-x-api";
import { fullName, isDir } from "tauri-plugin-fs-pro-api";
import {
  insertHistory,
  selectHistory,
  updateHistory,
} from "@/database/history";
import type { State } from "@/pages/Main";
import { clipboardStore } from "@/stores/clipboard";
import { consumeIgnoredClipboardChange } from "@/stores/clipboardRuntime";
import type { DatabaseSchemaHistory } from "@/types/database";
import { formatDate } from "@/utils/dayjs";
import { mergeDuplicateHistoryItems } from "@/utils/history";
import { isBlank } from "@/utils/is";

export const useClipboard = (
  state: State,
  options?: ClipboardChangeOptions,
) => {
  useMount(async () => {
    await startListening();

    onClipboardChange(async (result) => {
      if (consumeIgnoredClipboardChange()) return;

      const { files, image, text } = result;

      if (isEmpty(result) || Object.values(result).every(isEmpty)) return;

      const data = {
        createTime: formatDate(),
        favorite: false,
        group: "text",
        id: nanoid(),
        search: text?.value,
      } as DatabaseSchemaHistory;

      if (files) {
        const nextFiles = [];

        for (const path of files.value) {
          if (await isDir(path)) continue;

          nextFiles.push(path);
        }

        if (nextFiles.length === 0) return;

        Object.assign(data, files, {
          group: "files",
          search: nextFiles.join(" "),
          value: nextFiles,
        });
      } else if (text) {
        if (isBlank(text.value)) return;

        Object.assign(data, text);
      } else if (image) {
        Object.assign(data, image, {
          group: "files",
        });
      }

      const sqlData = cloneDeep(data);

      const { type, value, group, createTime } = data;

      if (type === "image") {
        sqlData.value = await fullName(value);
      }

      if (type === "files") {
        sqlData.value = JSON.stringify(value);
      }

      const [matched] = await selectHistory((qb) => {
        const { type, value } = sqlData;

        return qb.where("type", "=", type).where("value", "=", value);
      });

      const visible = state.group === "all" || state.group === group;

      if (matched) {
        if (!clipboardStore.content.autoSort) return;

        const { id } = matched;

        if (visible) {
          remove(state.list, { id });

          state.list = mergeDuplicateHistoryItems([
            { ...data, id },
            ...state.list,
          ]);
        }

        return updateHistory(id, { createTime });
      }

      if (visible) {
        state.list = mergeDuplicateHistoryItems([data, ...state.list]);
      }

      insertHistory(sqlData);
    }, options);
  });
};
