import { openPath } from "@tauri-apps/plugin-opener";
import { Flex } from "antd";
import type { HookAPI } from "antd/es/modal/useModal";
import clsx from "clsx";
import { type FC, useContext } from "react";
import { Marker } from "react-mark.js";
import { useSnapshot } from "valtio";
import UnoIcon from "@/components/UnoIcon";
import { LISTEN_KEY } from "@/constants";
import { updateHistory } from "@/database/history";
import { useContextMenu } from "@/hooks/useContextMenu";
import { MainContext } from "@/pages/Main";
import { pasteToClipboard } from "@/plugins/clipboard";
import { clipboardStore } from "@/stores/clipboard";
import type { DatabaseSchemaHistory } from "@/types/database";
import {
  isSingleImageFileHistoryItem,
  touchHistoryItem,
} from "@/utils/history";
import Files from "../Files";
import Header from "../Header";
import Image from "../Image";
import Text from "../Text";

export interface ItemProps {
  index: number;
  data: DatabaseSchemaHistory;
  deleteModal: HookAPI;
  handleNote: () => void;
}

const Item: FC<ItemProps> = (props) => {
  const { index, data, handleNote } = props;
  const { id, type, note, value } = data;
  const { rootState } = useContext(MainContext);
  const { content } = useSnapshot(clipboardStore);
  const canPreviewNoteContent =
    Boolean(note) && (type === "image" || isSingleImageFileHistoryItem(data));
  const showOriginalContentOnHover =
    content.showOriginalContent || canPreviewNoteContent;

  const handlePreview = () => {
    if (type === "files" && isSingleImageFileHistoryItem(data)) {
      return openPath(value[0]);
    }

    if (type !== "image") return;

    openPath(value);
  };

  const handleNext = () => {
    const { list } = rootState;

    const nextItem = list[index + 1] ?? list[index - 1];

    rootState.activeId = nextItem?.id;
  };

  const handlePrev = () => {
    if (index === 0) return;

    rootState.activeId = rootState.list[index - 1].id;
  };

  rootState.eventBus?.useSubscription((payload) => {
    if (payload.id !== id) return;

    const { handleDelete, handleFavorite } = rest;

    const touchCurrentItem = () => {
      if (!content.autoSort) return;

      const touched = touchHistoryItem(rootState.list, id);

      if (!touched) return;

      rootState.list = touched.list;
      updateHistory(id, { createTime: touched.createTime });
    };

    switch (payload.action) {
      case LISTEN_KEY.CLIPBOARD_ITEM_PREVIEW:
        return handlePreview();
      case LISTEN_KEY.CLIPBOARD_ITEM_PASTE:
        touchCurrentItem();
        return pasteToClipboard(data);
      case LISTEN_KEY.CLIPBOARD_ITEM_DELETE:
        return handleDelete();
      case LISTEN_KEY.CLIPBOARD_ITEM_SELECT_PREV:
        return handlePrev();
      case LISTEN_KEY.CLIPBOARD_ITEM_SELECT_NEXT:
        return handleNext();
      case LISTEN_KEY.CLIPBOARD_ITEM_FAVORITE:
        return handleFavorite();
    }
  });

  const { handleContextMenu, ...rest } = useContextMenu({
    ...props,
    handleNext,
  });

  const handleClick = (type: typeof content.autoPaste) => {
    rootState.activeId = id;

    if (content.autoPaste !== type) return;

    const touched = touchHistoryItem(rootState.list, id);

    if (content.autoSort && touched) {
      rootState.list = touched.list;
      updateHistory(id, { createTime: touched.createTime });
    }

    pasteToClipboard(data);
  };

  const renderContent = () => {
    switch (type) {
      case "text":
        return <Text {...data} />;
      case "image":
        return <Image {...data} />;
      case "files":
        return <Files {...data} />;
    }
  };

  return (
    <Flex
      className={clsx(
        "group b hover:b-primary-5 b-color-2 mx-3 max-h-30 rounded-md p-1.5 transition",
        {
          "b-primary bg-primary-1": rootState.activeId === id,
        },
      )}
      gap={4}
      onClick={() => handleClick("single")}
      onContextMenu={handleContextMenu}
      onDoubleClick={() => handleClick("double")}
      vertical
    >
      <Header {...rest} data={data} handleNote={handleNote} />

      <div className="relative flex-1 select-auto overflow-hidden break-words children:transition">
        <div
          className={clsx(
            "pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center font-bold opacity-0",
            {
              "group-hover:opacity-0": showOriginalContentOnHover,
              "opacity-100": note,
            },
          )}
        >
          <div className="line-clamp-3">
            <UnoIcon
              className="mr-1 inline-block translate-y-0.5"
              name="i-hugeicons:task-edit-01"
            />

            <Marker mark={rootState.search}>{note}</Marker>
          </div>
        </div>

        <div
          className={clsx("h-full", {
            "group-hover:opacity-100": showOriginalContentOnHover,
            "opacity-0": note,
          })}
        >
          {renderContent()}
        </div>
      </div>
    </Flex>
  );
};

export default Item;
