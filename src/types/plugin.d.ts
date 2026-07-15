export type WindowLabel = (typeof WINDOW_LABEL)[keyof typeof WINDOW_LABEL];

export interface ReadImage {
  width: number;
  height: number;
  image: string;
}

export interface ClipboardPayload {
  type?: "text" | "image" | "files";
  group: "text" | "image" | "files";
  count: number;
  value: string;
  search: string;
  width?: number;
  height?: number;
}
