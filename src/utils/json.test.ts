import assert from "node:assert/strict";
import { test } from "node:test";
import { formatJsonText } from "./json.ts";

test("只格式化以左花括号开头的有效JSON对象", () => {
  for (const text of [
    "360731199809037648",
    " 360731199809037648\r\n",
    '[{"id":360731199809037648}]',
    ' {"id":360731199809037648}',
    "{普通文本}",
    '{"id":1,}',
  ]) {
    assert.equal(formatJsonText(text), text);
  }
});

test("格式化JSON时只调整字符串之外的空白", () => {
  const input = String.raw`{"id":360731199809037648,"values":[-0,1.00,1e+999,{},[]],"key":" {,:\"} \u0031 ","id":1}`;
  const expected = String.raw`{
  "id": 360731199809037648,
  "values": [
    -0,
    1.00,
    1e+999,
    {},
    []
  ],
  "key": " {,:\"} \u0031 ",
  "id": 1
}`;

  assert.equal(formatJsonText(input), expected);
  assert.equal(formatJsonText(expected), expected);
  assert.equal(formatJsonText("{ }"), "{}");
});
