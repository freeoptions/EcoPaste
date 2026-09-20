export const formatJsonText = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return value;

  try {
    return JSON.stringify(JSON.parse(trimmedValue), null, 2);
  } catch {
    return value;
  }
};
