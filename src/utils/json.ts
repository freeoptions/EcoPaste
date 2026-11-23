export const formatJsonText = (value: string) => {
  if (!value.startsWith("{")) return value;

  try {
    JSON.parse(value);
  } catch {
    return value;
  }

  // 只用解析结果校验语法，输出使用原始词元，避免改写数字、字符串和键。
  const tokenList = value.match(
    /"(?:[^"\\]|\\[\s\S])*"|[{}[\],:]|[^\s"{}[\],:]+/g,
  );
  if (!tokenList) return value;

  let depth = 0;
  const lineBreak = () => `\n${"  ".repeat(depth)}`;

  return tokenList
    .map((token, index) => {
      const previous = tokenList[index - 1];

      switch (token) {
        case "{":
        case "[": {
          const prefix = previous === "," || previous === "[" ? lineBreak() : "";
          depth++;
          return prefix + token;
        }
        case "}":
        case "]":
          depth--;
          return (
            (previous === "{" || previous === "[" ? "" : lineBreak()) + token
          );
        case ":":
          return ": ";
        default:
          return (
            (previous === "{" || previous === "[" || previous === ","
              ? lineBreak()
              : "") + token
          );
      }
    })
    .join("");
};
