import { HappyProvider } from "@ant-design/happy-work-theme";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { error } from "@tauri-apps/plugin-log";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useBoolean, useEventListener, useKeyPress, useMount } from "ahooks";
import { ConfigProvider, theme } from "antd";
import { isString } from "es-toolkit";
import { RouterProvider } from "react-router-dom";
import { LISTEN_KEY, PRESET_SHORTCUT } from "./constants";
import { destroyDatabase } from "./database";
import { useTauriListen } from "./hooks/useTauriListen";
import { useWindowState } from "./hooks/useWindowState";
import { getAntdLocale } from "./locales";
import { hideWindow, showWindow } from "./plugins/window";
import { router } from "./router";
import { generateColorVars } from "./utils/color";
import { isURL } from "./utils/is";
import { restoreStore } from "./utils/store";

const { defaultAlgorithm } = theme;

const App = () => {
  const { restoreState } = useWindowState();
  const [ready, { toggle }] = useBoolean();

  useMount(async () => {
    await restoreState();
    await restoreStore();

    toggle();

    generateColorVars();
  });

  useTauriListen(LISTEN_KEY.SHOW_WINDOW, ({ payload }) => {
    const appWindow = getCurrentWebviewWindow();

    if (appWindow.label !== payload) return;

    showWindow();
  });

  useTauriListen(LISTEN_KEY.CLOSE_DATABASE, destroyDatabase);

  useEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest("a");

    if (!link) return;

    const { href, target } = link;

    if (target === "_blank") return;

    event.preventDefault();

    if (!isURL(href)) return;

    openUrl(href);
  });

  useKeyPress(["esc", PRESET_SHORTCUT.HIDE_WINDOW], hideWindow);

  useEventListener("unhandledrejection", ({ reason }) => {
    const message = isString(reason) ? reason : JSON.stringify(reason);

    error(message);
  });

  return (
    <ConfigProvider
      locale={getAntdLocale()}
      theme={{
        algorithm: defaultAlgorithm,
      }}
    >
      <HappyProvider>
        {ready && <RouterProvider router={router} />}
      </HappyProvider>
    </ConfigProvider>
  );
};

export default App;
