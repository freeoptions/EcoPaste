import { useMount, useUnmount } from "ahooks";
import { cloneDeep } from "es-toolkit";
import { isEmpty, remove } from "es-toolkit/compat";
import { nanoid } from "nanoid";
import { useRef } from "react";
import {
  type ClipboardChangeOptions,
  startListening,
} from "tauri-plugin-clipboard-x-api";
import { fullName, isDir } from "tauri-plugin-fs-pro-api";
import {
  insertHistory,
  selectHistory,
  updateHistory,
} from "@/database/history";
import type { State } from "@/pages/Main";
import { writeToClipboard } from "@/plugins/clipboard";
import { onClipboardChange } from "@/plugins/clipboardListener";
import { clipboardStore } from "@/stores/clipboard";
import type { DatabaseSchemaHistory } from "@/types/database";
import { formatDate } from "@/utils/dayjs";
import { mergeDuplicateHistoryItems } from "@/utils/history";
import { isBlank } from "@/utils/is";
import { formatJsonText } from "@/utils/json";

export const useClipboard = (
  state: State,
  options?: ClipboardChangeOptions,
) => {
  const unlistenRef = useRef(() => {});
  const disposedRef = useRef(false);

  useUnmount(() => {
    disposedRef.current = true;
    unlistenRef.current();
  });

  useMount(async () => {
    const unlisten = await onClipboardChange(async (result) => {
      const { files, image, text } = result;

      if (isEmpty(result) || Object.values(result).every(isEmpty)) return;

      const data = {
        createTime: formatDate(),
        favorite: false,
        group: "text",
        id: nanoid(),
        search: text?.value,
      } as DatabaseSchemaHistory;

      if (image) {
        Object.assign(data, image, {
          group: "files",
        });
      } else if (files) {
        const nextFileList = [];

        for (const path of files.value) {
          if (await isDir(path)) continue;

          nextFileList.push(path);
        }

        if (nextFileList.length === 0) return;

        Object.assign(data, files, {
          group: "files",
          search: nextFileList.join(" "),
          value: nextFileList,
        });
      } else if (text) {
        if (isBlank(text.value)) return;

        const formattedValue = formatJsonText(text.value);

        Object.assign(data, text, {
          search: formattedValue,
          value: formattedValue,
        });

        if (formattedValue !== text.value) {
          await writeToClipboard(data);
        }
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

      await insertHistory(sqlData);
    }, options);

    if (disposedRef.current) {
      unlisten();
      return;
    }

    unlistenRef.current = unlisten;
    await startListening();
  });
};
