import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useMount, useUnmount } from "ahooks";
import { debounce } from "es-toolkit";
import { useRef } from "react";

interface Props {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const useTauriFocus = (props: Props) => {
  const { onFocus, onBlur } = props;
  const unlistenRef = useRef(() => {});

  useMount(async () => {
    const appWindow = getCurrentWebviewWindow();

    const debounced = debounce(({ payload }) => {
      if (payload) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    }, 100);

    unlistenRef.current = await appWindow.onFocusChanged(debounced);
  });

  useUnmount(unlistenRef.current);
};
