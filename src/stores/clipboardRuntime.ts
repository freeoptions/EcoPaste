let ignoreClipboardChangeCount = 0;

export const ignoreNextClipboardChange = () => {
  ignoreClipboardChangeCount += 1;
};

export const consumeIgnoredClipboardChange = () => {
  if (ignoreClipboardChangeCount <= 0) return false;

  ignoreClipboardChangeCount -= 1;

  return true;
};
