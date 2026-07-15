import type { DatabaseSchemaHistory } from "@/types/database";
import { dayjs, formatDate } from "./dayjs";
import { isImage } from "./is";

const textLikeTypes = new Set(["text"]);

const getTextLikeKey = (item: DatabaseSchemaHistory) => {
  if (!textLikeTypes.has(item.type)) return;

  return item.search?.trim();
};

const getDisplayRank = (item: DatabaseSchemaHistory) => {
  if (item.favorite) return 50;
  if (item.note) return 40;
  if (item.type === "text") return 20;

  return 0;
};

export const isSingleImageFileHistoryItem = (item: DatabaseSchemaHistory) => {
  return (
    item.type === "files" &&
    Array.isArray(item.value) &&
    item.value.length === 1 &&
    isImage(item.value[0])
  );
};

export const normalizeHistoryItemForDisplay = (item: DatabaseSchemaHistory) => {
  if (item.type === "image") {
    return {
      ...item,
      group: "files",
    } as DatabaseSchemaHistory;
  }

  if (!isSingleImageFileHistoryItem(item)) return item;

  return {
    ...item,
    group: "files",
  } as DatabaseSchemaHistory;
};

export const mergeDuplicateHistoryItems = (list: DatabaseSchemaHistory[]) => {
  const merged = new Map<string, DatabaseSchemaHistory>();

  for (const rawItem of list) {
    const item = normalizeHistoryItemForDisplay(rawItem);
    const textKey = getTextLikeKey(item);
    const key = textKey ? `text:${textKey}` : `${item.type}:${item.id}`;
    const displayItem = textKey
      ? ({ ...item, type: "text", value: textKey } as DatabaseSchemaHistory)
      : item;
    const current = merged.get(key);

    if (!current || getDisplayRank(displayItem) > getDisplayRank(current)) {
      merged.set(key, displayItem);
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    return dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf();
  });
};

export const touchHistoryItem = (list: DatabaseSchemaHistory[], id: string) => {
  const matched = list.find((item) => item.id === id);

  if (!matched) return;

  const createTime = formatDate();

  return {
    createTime,
    list: mergeDuplicateHistoryItems([
      { ...matched, createTime },
      ...list.filter((item) => item.id !== id),
    ]),
  };
};
