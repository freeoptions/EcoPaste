import assert from "node:assert/strict";
import { test } from "node:test";
import {
  convertRadix,
  convertUnit,
  convertUrl,
  formatZonedDate,
  parseTimestamp,
  parseZonedDate,
  timeZoneList,
} from "./toolbox.ts";

test("常用进制互转，支持前缀、正负号、大小写和零", () => {
  const expectedList = ["11111111", "377", "255", "FF"];
  for (const [input, radix] of [
    ["11111111", 2],
    ["0o377", 8],
    ["+255", 10],
    ["0xFf", 16],
  ] as const) {
    assert.deepEqual(
      convertRadix(input, radix).map((item) => item.value),
      expectedList,
    );
  }
  assert.deepEqual(
    convertRadix(" -0Xff ", 16).map((item) => item.value),
    ["-11111111", "-377", "-255", "-FF"],
  );
  assert.equal(convertRadix("0b1010", 2)[2].value, "10");
  assert.ok(convertRadix("-000", 10).every((item) => item.value === "0"));
});

test("大整数转换不经过浮点数，不截断无效字符", () => {
  const resultList = convertRadix("18446744073709551615", 10);
  assert.equal(resultList[3].value, "FFFFFFFFFFFFFFFF");
  assert.equal(
    convertRadix(resultList[3].value, 16)[2].value,
    "18446744073709551615",
  );
  for (const [input, radix] of [
    ["102", 2],
    ["8", 8],
    ["1.5", 10],
    ["1e3", 10],
    ["FFz", 16],
    ["0xFF", 10],
    ["0b", 2],
    ["--1", 10],
    ["", 10],
    ["1 2", 10],
    ["10", 3],
  ] as const) {
    assert.throws(() => convertRadix(input, radix));
  }
});

test("秒、毫秒、小数秒及纪元前时间戳保持毫秒精度", () => {
  assert.equal(parseTimestamp("1700000000", "s"), 1700000000000);
  assert.equal(parseTimestamp("1700000000000", "ms"), 1700000000000);
  assert.equal(parseTimestamp("1.001", "s"), 1001);
  assert.equal(parseTimestamp("-0.001", "s"), -1);
  assert.equal(parseTimestamp("0", "ms"), 0);
  assert.throws(() => parseTimestamp("", "s"));
  assert.throws(() => parseTimestamp("1.0001", "s"));
  assert.throws(() => parseTimestamp("170000000000000000", "ms"));
});

test("日期显示到秒，解析保留输入精度并拒绝无效日期", () => {
  assert.equal(parseZonedDate("1970-01-01 08:00:00", "UTC+8"), 0);
  assert.equal(
    parseZonedDate("2024-02-29 12:30:45.123", "UTC+8"),
    Date.parse("2024-02-29T04:30:45.123Z"),
  );
  assert.equal(formatZonedDate(-1, "UTC+0"), "1969-12-31 23:59:59");
  assert.throws(() => parseZonedDate("2023-02-29 00:00:00", "UTC+0"));
  assert.throws(() => parseZonedDate("2024-01-01 24:00:00", "UTC+0"));
  assert.throws(() => parseZonedDate("2024-01-01", "UTC+0"));
});

test("UTC偏移覆盖完整小时与分数时区，不受夏令时影响", () => {
  for (let hour = -12; hour <= 14; hour++) {
    const value = `UTC${hour < 0 ? "" : "+"}${hour}`;
    assert.ok(
      timeZoneList.some((item) => item.value === value),
      value,
    );
    assert.equal(
      parseZonedDate("2024-01-01 12:00:00", value),
      Date.parse("2024-01-01T12:00:00Z") - hour * 3600000,
    );
  }
  assert.equal(
    timeZoneList.find((item) => item.value === "UTC-12")?.label,
    "UTC-12",
  );
  assert.equal(
    timeZoneList.find((item) => item.value === "UTC+8")?.label,
    "UTC+8（北京、新加坡）",
  );
  assert.equal(
    parseZonedDate("2024-07-01 12:00:00", "UTC-8"),
    Date.parse("2024-07-01T20:00:00Z"),
  );
  assert.equal(
    parseZonedDate("2024-01-01 12:00:00", "UTC+5:45"),
    Date.parse("2024-01-01T06:15:00Z"),
  );
  assert.equal(
    parseZonedDate("2024-01-01 12:00:00", "UTC-3:30"),
    Date.parse("2024-01-01T15:30:00Z"),
  );
  assert.equal(
    formatZonedDate(Date.parse("2026-11-13T05:42:08.102Z"), "UTC+8"),
    "2026-11-13 13:42:08",
  );
  assert.equal(
    formatZonedDate(Date.parse("2024-01-01T12:00:00Z"), "UTC+14"),
    "2024-01-02 02:00:00",
  );
  assert.throws(() => parseZonedDate("2024-01-01 12:00:00", "UTC+99"));
});

test("公英制、温度偏移和十进制二进制数据单位正确换算", () => {
  assert.equal(convertUnit("2.54", "length", "cm", "in"), "1");
  assert.equal(convertUnit("1", "mass", "lb", "kg"), "0.45359237");
  assert.equal(convertUnit("32", "temperature", "f", "c"), "0");
  assert.equal(convertUnit("100", "temperature", "c", "f"), "212");
  assert.equal(convertUnit("0", "temperature", "k", "c"), "-273.15");
  assert.equal(convertUnit("1", "data", "kb", "b"), "1000");
  assert.equal(convertUnit("1", "data", "kib", "b"), "1024");
  assert.equal(convertUnit("1", "duration", "h", "s"), "3600");
  assert.equal(convertUnit("1", "area", "ha", "m2"), "10000");
  assert.equal(convertUnit("1", "volume", "m3", "l"), "1000");
  assert.throws(() => convertUnit("-1", "temperature", "k", "c"));
  assert.throws(() => convertUnit("Infinity", "length", "m", "cm"));
  assert.throws(() => convertUnit(" ", "length", "m", "cm"));
  assert.throws(() => convertUnit("1e309", "length", "m", "cm"));
});

test("URL区分参数、完整地址和表单编码，错误输入给出提示", () => {
  const value = "你好 + &/?=";
  assert.equal(
    convertUrl(convertUrl(value, "encode", "component"), "decode", "component"),
    value,
  );
  assert.equal(
    convertUrl("https://example.com/?q=你好", "encode", "uri"),
    "https://example.com/?q=%E4%BD%A0%E5%A5%BD",
  );
  assert.equal(convertUrl("%2F%3F%26", "decode", "uri"), "%2F%3F%26");
  assert.equal(convertUrl("a+b%2Bc", "decode", "component"), "a+b+c");
  assert.equal(convertUrl("a+b%2Bc", "decode", "form"), "a b+c");
  assert.equal(convertUrl("a +~!", "encode", "form"), "a+%2B%7E%21");
  assert.throws(() => convertUrl("%E4%BD", "decode", "component"), /无法解码/);
});
