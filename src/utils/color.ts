import { theme } from "antd";
import { kebabCase } from "es-toolkit";
import { map } from "es-toolkit/compat";

const { getDesignToken } = theme;

/**
 * 生成 antd 的颜色变量
 */
export const generateColorVars = () => {
  const vars: Record<string, any> = {};

  for (const [key, value] of Object.entries(getDesignToken())) {
    vars[`--ant-${kebabCase(key)}`] = value;
  }

  const style = document.createElement("style");

  style.dataset.theme = "light";

  const values = map(vars, (value, key) => `${key}: ${value};`);

  style.innerHTML = `:root{\n${values.join("\n")}\n}`;

  document.head.appendChild(style);
};
