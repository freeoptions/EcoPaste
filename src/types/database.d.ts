import type {
  ClipboardContentType,
  ReadClipboardItemUnion,
} from "tauri-plugin-clipboard-x-api";
import type { LiteralUnion } from "type-fest";

export type DatabaseSchemaHistory<
  T extends ClipboardContentType = "text" | "image" | "files",
> = ReadClipboardItemUnion<T> & {
  id: string;
  group: DatabaseSchemaGroupId;
  search: string;
  favorite: boolean;
  createTime: string;
  note?: string;
};

export type DatabaseSchemaGroupId = LiteralUnion<
  "all" | "text" | "files" | "favorite",
  string
>;

export interface DatabaseSchemaGroup {
  id: DatabaseSchemaGroupId;
  name: string;
  createTime?: string;
}

export interface DatabaseSchema {
  history: DatabaseSchemaHistory;
  group: DatabaseSchemaGroup;
}
