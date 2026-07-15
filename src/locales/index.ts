import antdZhCN from "antd/locale/zh_CN";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./zh-CN.json";

i18n.use(initReactI18next).init({
  debug: false,
  fallbackLng: "zh-CN",
  interpolation: {
    escapeValue: false,
  },
  lng: "zh-CN",
  resources: {
    "zh-CN": {
      translation: zhCN,
    },
  },
});

export { i18n };

export const getAntdLocale = () => antdZhCN;
