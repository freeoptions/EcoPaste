import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { warn } from "@tauri-apps/plugin-log";
import {
  type ClipboardChangeOptions,
  COMMAND,
  hasFiles,
  hasImage,
  hasText,
  type ReadClipboard,
  readFiles,
  readImage,
  readText,
} from "tauri-plugin-clipboard-x-api";
import { consumeIgnoredClipboardChange } from "@/stores/clipboardRuntime";
import { wait } from "@/utils/shared";

// 只读取历史记录实际使用的格式，各格式失败不影响已读取的内容。
const formatReaderList: {
  format: string;
  read: () => Promise<ReadClipboard>;
}[] = [
  {
    format: "image",
    async read() {
      if (!(await hasImage())) return {};

      const { path, size, width, height } = await readImage();

      return {
        image: { count: size, height, type: "image", value: path, width },
      };
    },
  },
  {
    format: "files",
    async read() {
      if (!(await hasFiles())) return {};

      const { paths, size } = await readFiles();

      return { files: { count: size, type: "files", value: paths } };
    },
  },
  {
    format: "text",
    async read() {
      if (!(await hasText())) return {};

      const value = await readText();

      return { text: { count: value.length, type: "text", value } };
    },
  },
];

const retryDelayList = [50, 100, 200, 400];

export const onClipboardChange = async (
  callback: (result: ReadClipboard) => Promise<unknown>,
  options?: ClipboardChangeOptions,
) => {
  let generation = 0;
  let disposed = false;

  const unlisten = await listen(COMMAND.CLIPBOARD_CHANGED, async () => {
    if (disposed) return;

    const currentGeneration = ++generation;

    // 在事件到达时消费忽略标记，避免读取失败后误吞下一次用户复制。
    if (consumeIgnoredClipboardChange()) return;

    const isActive = () => !disposed && currentGeneration === generation;
    const sequence = await invoke<number>("clipboard_sequence_number");
    const isCurrent = async () =>
      isActive() &&
      sequence === (await invoke<number>("clipboard_sequence_number")) &&
      isActive();

    if (!(await isCurrent())) return;

    options?.beforeRead?.();

    const result: ReadClipboard = {};
    let pendingReaderList = formatReaderList;
    const failureMap = new Map<string, string>();

    for (let attempt = 0; attempt <= retryDelayList.length; attempt++) {
      const failedReaderList: typeof formatReaderList = [];

      for (const reader of pendingReaderList) {
        if (!(await isCurrent())) return;

        try {
          const content = await reader.read();

          // 原生序列号可检测通知尚未送达前发生的下一次复制。
          if (!(await isCurrent())) return;

          Object.assign(result, content);
          failureMap.delete(reader.format);

          // 截图同时提供文件格式时，图片已读取成功就无需再读文件。
          if (result.image) {
            failureMap.clear();
            break;
          }
        } catch (error) {
          if (!(await isCurrent())) return;

          failedReaderList.push(reader);
          failureMap.set(reader.format, String(error));
        }
      }

      if (result.image || failedReaderList.length === 0) break;
      if (attempt === retryDelayList.length) break;

      pendingReaderList = failedReaderList;
      await wait(retryDelayList[attempt]);
    }

    if (!(await isCurrent())) return;

    if (failureMap.size > 0) {
      // 不记录剪贴板正文，保留格式、序列号和读取错误以便追查。
      void warn(
        `[clipboard] sequence=${sequence}, read failed after 5 attempts: ${[
          ...failureMap,
        ]
          .map(([format, error]) => `${format}: ${error}`)
          .join("; ")}`,
      );
    }

    await callback(result);
  });

  return () => {
    disposed = true;
    generation++;
    unlisten();
  };
};
