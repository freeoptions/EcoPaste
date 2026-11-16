const utcOffsetList: [number, string?][] = [
  [-720],
  [-660, "帕果帕果"],
  [-600, "檀香山"],
  [-570, "泰奥海"],
  [-540, "安克雷奇"],
  [-480, "洛杉矶"],
  [-420, "丹佛"],
  [-360, "墨西哥城"],
  [-300, "纽约"],
  [-240, "加拉加斯"],
  [-210, "圣约翰斯"],
  [-180, "布宜诺斯艾利斯"],
  [-120, "努克"],
  [-60, "普拉亚"],
  [0, "伦敦"],
  [60, "巴黎"],
  [120, "开罗"],
  [180, "莫斯科"],
  [210, "德黑兰"],
  [240, "迪拜"],
  [270, "喀布尔"],
  [300, "卡拉奇"],
  [330, "新德里"],
  [345, "加德满都"],
  [360, "达卡"],
  [390, "仰光"],
  [420, "曼谷"],
  [480, "北京、新加坡"],
  [525, "尤克拉"],
  [540, "东京"],
  [570, "达尔文"],
  [600, "布里斯班"],
  [630, "阿德莱德"],
  [660, "努美阿"],
  [720, "苏瓦"],
  [765],
  [780, "阿皮亚"],
  [825],
  [840],
];

export const timeZoneList = utcOffsetList.map(([offset, city]) => {
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const value = `UTC${offset < 0 ? "-" : "+"}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
  return { label: city ? `${value}（${city}）` : value, offset, value };
});

function getUtcOffset(timeZone: string) {
  const zone = timeZoneList.find((item) => item.value === timeZone);
  if (!zone) throw new Error("请选择有效的UTC时区");
  return zone.offset * 60000;
}

export function formatZonedDate(milliseconds: number, timeZone: string) {
  return new Date(milliseconds + getUtcOffset(timeZone))
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

// 日期按固定UTC偏移解析，显示到秒，输入中的毫秒仍用于时间戳换算。
export function parseZonedDate(value: string, timeZone: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value.trim(),
    );
  if (!match) throw new Error("请输入yyyy-MM-dd HH:mm:ss格式的日期时间");
  const [, year, month, day, hour, minute, second = "00", fraction = "0"] =
    match;
  const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}.${fraction.padEnd(3, "0")}Z`;
  const naive = Date.parse(normalized);
  if (!Number.isFinite(naive) || new Date(naive).toISOString() !== normalized) {
    throw new Error("日期或时间无效，请检查年月日和时分秒");
  }
  return naive - getUtcOffset(timeZone);
}

export function parseTimestamp(value: string, unit: "s" | "ms") {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new Error("请输入有效的数字时间戳");
  const [, sign, whole, fraction = ""] = match;
  const precision = unit === "s" ? 3 : 0;
  if (/[1-9]/.test(fraction.slice(precision)))
    throw new Error("时间戳精度不能小于1毫秒");
  const milliseconds = Number(
    `${sign}${whole}${fraction.slice(0, precision).padEnd(precision, "0")}`,
  );
  if (
    !Number.isSafeInteger(milliseconds) ||
    milliseconds < -62135596800000 ||
    milliseconds > 253402300799999
  ) {
    throw new Error("时间戳超出范围，或精度小于1毫秒");
  }
  return milliseconds;
}

interface Unit {
  label: string;
  value: string;
  factor: number;
  offset?: number;
}

export const unitCategoryList: {
  label: string;
  value: string;
  unitList: Unit[];
}[] = [
  {
    label: "长度",
    unitList: [
      { factor: 0.001, label: "毫米mm", value: "mm" },
      { factor: 0.01, label: "厘米cm", value: "cm" },
      { factor: 1, label: "米m", value: "m" },
      { factor: 1000, label: "千米km", value: "km" },
      { factor: 0.0254, label: "英寸in", value: "in" },
      { factor: 0.3048, label: "英尺ft", value: "ft" },
      { factor: 0.9144, label: "码yd", value: "yd" },
      { factor: 1609.344, label: "英里mi", value: "mi" },
    ],
    value: "length",
  },
  {
    label: "重量",
    unitList: [
      { factor: 0.001, label: "克g", value: "g" },
      { factor: 1, label: "千克kg", value: "kg" },
      { factor: 1000, label: "吨t", value: "t" },
      { factor: 0.45359237, label: "磅lb", value: "lb" },
      { factor: 0.028349523125, label: "盎司oz", value: "oz" },
    ],
    value: "mass",
  },
  {
    label: "温度",
    unitList: [
      { factor: 1, label: "摄氏度 °C", value: "c" },
      { factor: 5 / 9, label: "华氏度 °F", offset: (-32 * 5) / 9, value: "f" },
      { factor: 1, label: "开尔文K", offset: -273.15, value: "k" },
    ],
    value: "temperature",
  },
  {
    label: "面积",
    unitList: [
      { factor: 1, label: "平方米m²", value: "m2" },
      { factor: 0.09290304, label: "平方英尺ft²", value: "ft2" },
      { factor: 10000, label: "公顷ha", value: "ha" },
      { factor: 1000000, label: "平方千米km²", value: "km2" },
    ],
    value: "area",
  },
  {
    label: "体积",
    unitList: [
      { factor: 0.001, label: "毫升mL", value: "ml" },
      { factor: 1, label: "升L", value: "l" },
      { factor: 1000, label: "立方米m³", value: "m3" },
      { factor: 28.316846592, label: "立方英尺ft³", value: "ft3" },
      { factor: 3.785411784, label: "美制加仑gal", value: "gal" },
    ],
    value: "volume",
  },
  {
    label: "数据大小",
    unitList: [
      { factor: 1, label: "字节B", value: "b" },
      { factor: 1000, label: "KB·1000B", value: "kb" },
      { factor: 1000000, label: "MB·1000KB", value: "mb" },
      { factor: 1000000000, label: "GB·1000MB", value: "gb" },
      { factor: 1024, label: "KiB·1024B", value: "kib" },
      { factor: 1048576, label: "MiB·1024KiB", value: "mib" },
      { factor: 1073741824, label: "GiB·1024MiB", value: "gib" },
    ],
    value: "data",
  },
  {
    label: "时间",
    unitList: [
      { factor: 0.001, label: "毫秒ms", value: "ms" },
      { factor: 1, label: "秒s", value: "s" },
      { factor: 60, label: "分钟min", value: "min" },
      { factor: 3600, label: "小时h", value: "h" },
      { factor: 86400, label: "天d", value: "d" },
    ],
    value: "duration",
  },
];

export function convertUnit(
  value: string,
  category: string,
  from: string,
  to: string,
) {
  if (
    !value.trim() ||
    !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())
  ) {
    throw new Error("请输入有效数值");
  }
  const unitList = unitCategoryList.find(
    (item) => item.value === category,
  )?.unitList;
  const source = unitList?.find((item) => item.value === from);
  const target = unitList?.find((item) => item.value === to);
  if (!source || !target) throw new Error("请选择同一类别的单位");
  const base = Number(value) * source.factor + (source.offset ?? 0);
  if (category === "temperature" && base < -273.15 - 1e-10)
    throw new Error("温度不能低于绝对零度");
  const result = (base - (target.offset ?? 0)) / target.factor;
  if (!Number.isFinite(result)) throw new Error("数值超出可计算范围");
  return String(Number(result.toPrecision(12)));
}

export const radixOptionList = [
  { label: "二进制(2)", value: 2 },
  { label: "八进制(8)", value: 8 },
  { label: "十进制(10)", value: 10 },
  { label: "十六进制(16)", value: 16 },
];

export function convertRadix(value: string, radix: number) {
  const patternMap: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[\da-f]+$/i,
  };
  const prefixMap: Record<number, string> = {
    2: "0b",
    8: "0o",
    10: "",
    16: "0x",
  };
  if (!patternMap[radix]) throw new Error("请选择二、八、十或十六进制");
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  let digits = trimmed.replace(/^[+-]/, "");
  const prefix = prefixMap[radix];
  if (prefix && digits.toLowerCase().startsWith(prefix))
    digits = digits.slice(2);
  if (!patternMap[radix].test(digits)) {
    throw new Error("请输入符合所选进制的整数，不支持小数");
  }
  const integer = BigInt(`${prefix}${digits}`) * (negative ? -1n : 1n);
  return radixOptionList.map((option) => ({
    label: option.label,
    value: integer.toString(option.value).toUpperCase(),
  }));
}

export function convertUrl(
  value: string,
  action: "encode" | "decode",
  mode: "component" | "uri" | "form",
) {
  try {
    if (action === "encode") {
      if (mode === "uri") return encodeURI(value);
      const result = encodeURIComponent(value);
      return mode === "form"
        ? result
            .replace(/%20/g, "+")
            .replace(
              /[!'()~]/g,
              (character) =>
                `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
            )
        : result;
    }
    if (mode === "uri") return decodeURI(value);
    return decodeURIComponent(
      mode === "form" ? value.replace(/\+/g, " ") : value,
    );
  } catch {
    throw new Error(
      action === "decode"
        ? "无法解码，请检查百分号编码和UTF-8字符是否完整"
        : "无法编码，输入包含不完整的Unicode字符",
    );
  }
}
