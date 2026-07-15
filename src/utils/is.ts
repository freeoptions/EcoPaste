import { isString } from "es-toolkit";
import { isEmpty } from "es-toolkit/compat";
import isUrl from "is-url";

export const isDev = () => {
  return import.meta.env.DEV;
};

export const isWin = true;

export const isURL = (value: string) => {
  return isUrl(value);
};

export const isEmail = (value: string) => {
  const regex = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;

  return regex.test(value);
};

export const isColor = (value: string) => {
  const excludes = [
    "none",
    "currentColor",
    "-moz-initial",
    "inherit",
    "initial",
    "revert",
    "revert-layer",
    "unset",
    "ActiveBorder",
    "ActiveCaption",
    "AppWorkspace",
    "Background",
    "ButtonFace",
    "ButtonHighlight",
    "ButtonShadow",
    "ButtonText",
    "CaptionText",
    "GrayText",
    "Highlight",
    "HighlightText",
    "InactiveBorder",
    "InactiveCaption",
    "InactiveCaptionText",
    "InfoBackground",
    "InfoText",
    "Menu",
    "MenuText",
    "Scrollbar",
    "ThreeDDarkShadow",
    "ThreeDFace",
    "ThreeDHighlight",
    "ThreeDLightShadow",
    "ThreeDShadow",
    "Window",
    "WindowFrame",
    "WindowText",
  ];

  if (excludes.includes(value) || value.includes("url")) return false;

  const style = new Option().style;

  style.backgroundColor = value;
  style.backgroundImage = value;

  const { backgroundColor, backgroundImage } = style;

  return backgroundColor !== "" || backgroundImage !== "";
};

export const isImage = (value: string) => {
  const regex = /\.(jpe?g|png|webp|avif|gif|svg|bmp|ico|tiff?|heic|apng)$/i;

  return regex.test(value);
};

export const isBlank = (value: unknown) => {
  if (isString(value)) {
    return isEmpty(value.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim());
  }

  return true;
};
