import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { resolveResource } from "@tauri-apps/api/path";
import { TrayIcon, type TrayIconOptions } from "@tauri-apps/api/tray";
import { exit } from "@tauri-apps/plugin-process";
import { useTranslation } from "react-i18next";
import { showWindow } from "@/plugins/window";
import { globalStore } from "@/stores/global";
import { useSubscribeKey } from "./useSubscribeKey";

const TRAY_ID = "app-tray";

const formatAppVersion = (version?: string) => {
  return version?.match(/^\d+\.\d+/)?.[0] ?? version ?? "";
};

export const useTray = () => {
  const { t } = useTranslation();

  useSubscribeKey(globalStore.app, "showMenubarIcon", async (value) => {
    const tray = await getTrayById();

    if (tray) {
      tray.setVisible(value);
    } else {
      createTray();
    }
  });

  const getTrayById = () => {
    return TrayIcon.getById(TRAY_ID);
  };

  const createTray = async () => {
    if (!globalStore.app.showMenubarIcon) return;

    const tray = await getTrayById();

    if (tray) return;

    const { appName, appVersion } = globalStore.env;
    const displayVersion = formatAppVersion(appVersion);
    const menu = await getTrayMenu();
    const icon = await resolveResource("assets/tray.ico");

    const options: TrayIconOptions = {
      action: (event) => {
        if (event.type === "Click" && event.button === "Left") {
          showWindow("main");
        }
      },
      icon,
      iconAsTemplate: true,
      id: TRAY_ID,
      menu,
      tooltip: `${appName} v${displayVersion}`,
    };

    return TrayIcon.new(options);
  };

  const getTrayMenu = async () => {
    const { appVersion } = globalStore.env;
    const displayVersion = formatAppVersion(appVersion);

    const items = await Promise.all([
      MenuItem.new({
        action: () => showWindow("preference"),
        text: t("component.tray.label.preference"),
      }),
      PredefinedMenuItem.new({ item: "Separator" }),
      MenuItem.new({
        enabled: false,
        text: `${t("component.tray.label.version")} ${displayVersion}`,
      }),
      MenuItem.new({
        action: () => exit(0),
        text: t("component.tray.label.exit"),
      }),
    ]);

    return Menu.new({ items });
  };

  return {
    createTray,
  };
};
