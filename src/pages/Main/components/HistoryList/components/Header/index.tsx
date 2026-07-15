import { useCreation } from "ahooks";
import { Flex } from "antd";
import clsx from "clsx";
import { filesize } from "filesize";
import { type FC, type MouseEvent, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import Scrollbar from "@/components/Scrollbar";
import UnoIcon from "@/components/UnoIcon";
import { updateHistory } from "@/database/history";
import { MainContext } from "@/pages/Main";
import { transferData } from "@/pages/Preference/components/Clipboard/components/OperationButton";
import { pasteToClipboard, writeToClipboard } from "@/plugins/clipboard";
import { clipboardStore } from "@/stores/clipboard";
import type { DatabaseSchemaHistory } from "@/types/database";
import type { OperationButton } from "@/types/store";
import { dayjs } from "@/utils/dayjs";
import {
  isSingleImageFileHistoryItem,
  touchHistoryItem,
} from "@/utils/history";

interface HeaderProps {
  data: DatabaseSchemaHistory;
  handleNote: () => void;
  handleFavorite: () => void;
  handleDelete: () => void;
}

const Header: FC<HeaderProps> = (props) => {
  const { data } = props;
  const { id, type, value, count, createTime, favorite } = data;
  const { rootState } = useContext(MainContext);
  const { t } = useTranslation();
  const { content } = useSnapshot(clipboardStore);

  const operationButtons = useCreation(() => {
    return content.operationButtons.map((key) => {
      return transferData.find((data) => data.key === key)!;
    });
  }, [content.operationButtons]);

  const renderType = () => {
    switch (type) {
      case "text":
        return t("clipboard.label.plain_text");
      case "image":
        return t("clipboard.label.image");
      case "files":
        if (isSingleImageFileHistoryItem(data)) {
          return t("clipboard.label.image");
        }

        return t("clipboard.label.n_files", {
          replace: [value.length],
        });
    }
  };

  const renderCount = () => {
    if (type === "files" || type === "image") {
      return filesize(count, { standard: "jedec" });
    }

    return t("clipboard.label.n_chars", {
      replace: [count],
    });
  };

  const renderPixel = () => {
    if (type !== "image") return;

    const { width, height } = data;

    return (
      <span>
        {width}×{height}
      </span>
    );
  };

  const handleClick = (event: MouseEvent, key: OperationButton) => {
    const { handleNote, handleFavorite, handleDelete } = props;

    event.stopPropagation();

    switch (key) {
      case "copy": {
        const touched = touchHistoryItem(rootState.list, id);

        if (content.autoSort && touched) {
          rootState.list = touched.list;
          updateHistory(id, { createTime: touched.createTime });
        }

        return writeToClipboard(data);
      }
      case "pastePlain": {
        const touched = touchHistoryItem(rootState.list, id);

        if (content.autoSort && touched) {
          rootState.list = touched.list;
          updateHistory(id, { createTime: touched.createTime });
        }

        return pasteToClipboard(data, true);
      }
      case "note":
        return handleNote();
      case "star":
        return handleFavorite();
      case "delete":
        return handleDelete();
    }
  };

  return (
    <Flex className="text-color-2" gap="small" justify="space-between">
      <Scrollbar thumbSize={0}>
        <Flex className="flex-1 whitespace-nowrap text-xs" gap="small">
          <span>{renderType()}</span>
          <span>{renderCount()}</span>
          {renderPixel()}
          <span>{dayjs(createTime).fromNow()}</span>
        </Flex>
      </Scrollbar>

      <Flex
        align="center"
        className={clsx("opacity-0 transition group-hover:opacity-100", {
          "opacity-100": rootState.activeId === id,
        })}
        gap={6}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {operationButtons.map((item) => {
          const { key, icon, activeIcon, title } = item;

          const isFavorite = key === "star" && favorite;

          return (
            <UnoIcon
              className={clsx({ "text-gold!": isFavorite })}
              hoverable
              key={key}
              name={isFavorite ? activeIcon : icon}
              onClick={(event) => handleClick(event, key)}
              title={t(title)}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Header;
