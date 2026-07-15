import { defaults } from "es-toolkit/compat";

export interface Key {
  eventKey: string;
  hookKey?: string;
  tauriKey?: string;
  symbol?: string;
}

export const modifierKeys: Key[] = [
  {
    eventKey: "Shift",
    symbol: "Shift",
  },
  {
    eventKey: "Control",
    hookKey: "ctrl",
    symbol: "Ctrl",
  },
  {
    eventKey: "Alt",
    symbol: "Alt",
  },
  {
    eventKey: "Command",
    hookKey: "meta",
    symbol: "Super",
  },
].map((item) => {
  const { eventKey } = item;

  defaults<Key, Partial<Key>>(item, {
    hookKey: eventKey.toLowerCase(),
    tauriKey: eventKey,
  });

  return item;
});

export const standardKeys: Key[] = [
  {
    eventKey: "Escape",
    hookKey: "esc",
    symbol: "Esc",
  },
  ...Array.from({ length: 12 }, (_, index) => ({
    eventKey: `F${index + 1}`,
  })),
  {
    eventKey: "Backquote",
    hookKey: "graveaccent",
    symbol: "`",
  },
  ...Array.from({ length: 10 }, (_, index) => ({
    eventKey: `Digit${(index + 1) % 10}`,
  })),
  {
    eventKey: "Minus",
    hookKey: "dash",
    symbol: "-",
    tauriKey: "-",
  },
  {
    eventKey: "Equal",
    hookKey: "equalsign",
    symbol: "=",
    tauriKey: "=",
  },
  {
    eventKey: "Backspace",
  },
  {
    eventKey: "Tab",
  },
  ..."QWERTYUIOP".split("").map((key) => ({
    eventKey: `Key${key}`,
  })),
  {
    eventKey: "BracketLeft",
    hookKey: "openbracket",
    symbol: "[",
  },
  {
    eventKey: "BracketRight",
    hookKey: "closebracket",
    symbol: "]",
  },
  {
    eventKey: "Backslash",
    symbol: "\\",
  },
  ..."ASDFGHJKL".split("").map((key) => ({
    eventKey: `Key${key}`,
  })),
  {
    eventKey: "Semicolon",
    symbol: ";",
  },
  {
    eventKey: "Quote",
    hookKey: "singlequote",
    symbol: "'",
  },
  {
    eventKey: "Enter",
  },
  ..."ZXCVBNM".split("").map((key) => ({
    eventKey: `Key${key}`,
  })),
  {
    eventKey: "Comma",
    symbol: ",",
  },
  {
    eventKey: "Period",
    symbol: ".",
  },
  {
    eventKey: "Slash",
    hookKey: "forwardslash",
    symbol: "/",
  },
  {
    eventKey: "Space",
  },
  {
    eventKey: "ArrowUp",
    hookKey: "uparrow",
    symbol: "Up",
  },
  {
    eventKey: "ArrowDown",
    hookKey: "downarrow",
    symbol: "Down",
  },
  {
    eventKey: "ArrowLeft",
    hookKey: "leftarrow",
    symbol: "Left",
  },
  {
    eventKey: "ArrowRight",
    hookKey: "rightarrow",
    symbol: "Right",
  },
  {
    eventKey: "Delete",
  },
].map((item) => {
  const { eventKey } = item;

  defaults<Key, Partial<Key>>(item, {
    hookKey: eventKey.toLowerCase(),
    symbol: eventKey,
    tauriKey: eventKey,
  });

  if (eventKey.startsWith("Digit") || eventKey.startsWith("Key")) {
    item.tauriKey = item.symbol = eventKey.slice(-1);

    item.hookKey = item.tauriKey.toLowerCase();
  }

  return item;
});

export const keys = modifierKeys.concat(standardKeys);

export const getKeySymbol = (key: string) => {
  const fields = ["tauriKey", "hookKey"] as const;

  const matched = keys.find((entry) => {
    return fields.some((field) => entry[field] === key);
  });

  return matched?.symbol ?? key;
};
