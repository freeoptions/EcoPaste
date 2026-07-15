import { copyFile, exists, remove } from "@tauri-apps/plugin-fs";
import { useAsyncEffect, useReactive } from "ahooks";
import { isString } from "es-toolkit";
import { unionBy } from "es-toolkit/compat";
import { useContext } from "react";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import { LISTEN_KEY } from "@/constants";
import { deleteHistory, selectHistory } from "@/database/history";
import { MainContext } from "@/pages/Main";
import { mergeDuplicateHistoryItems } from "@/utils/history";
import { isBlank } from "@/utils/is";
import { getSaveImagePath, join } from "@/utils/path";
import { useTauriListen } from "./useTauriListen";

interface Options {
  scrollToTop: () => void;
}

export const useHistoryList = (options: Options) => {
  const { scrollToTop } = options;
  const { rootState } = useContext(MainContext);
  const state = useReactive({
    loading: false,
    noMore: false,
    page: 1,
    size: 20,
  });

  const fetchData = async () => {
    try {
      if (state.loading) return;

      state.loading = true;

      const { page } = state;
      const { group } = rootState;

      const list = await selectHistory((qb) => {
        const { size } = state;
        const { search } = rootState;
        const isFavoriteGroup = group === "favorite";

        return qb
          .$if(isFavoriteGroup, (eb) => eb.where("favorite", "=", true))
          .$if(group === "text", (eb) => eb.where("group", "=", "text"))
          .$if(group === "files", (eb) => eb.where("group", "=", "files"))
          .$if(!isBlank(search), (eb) => {
            return eb.where((eb) => {
              return eb.or([
                eb("search", "like", eb.val(`%${search}%`)),
                eb("note", "like", eb.val(`%${search}%`)),
              ]);
            });
          })
          .offset((page - 1) * size)
          .limit(size)
          .orderBy("createTime", "desc");
      });

      const visibleList = [];

      for (const item of list) {
        const { type, value } = item;

        if (type === "text" && isBlank(value)) {
          await deleteHistory(item);

          continue;
        }

        if (!isString(value)) continue;

        if (type === "image") {
          const oldPath = join(getSaveImagePath(), value);
          const newPath = join(await getDefaultSaveImagePath(), value);

          if (await exists(oldPath)) {
            await copyFile(oldPath, newPath);

            remove(oldPath);
          }

          item.value = newPath;
        }

        if (type === "files") {
          item.value = JSON.parse(value);
        }

        visibleList.push(item);
      }

      state.noMore = visibleList.length === 0;

      const nextList =
        page === 1 ? visibleList : unionBy(rootState.list, visibleList, "id");

      rootState.list = mergeDuplicateHistoryItems(nextList);

      if (!rootState.list.some(({ id }) => id === rootState.activeId)) {
        rootState.activeId = rootState.list[0]?.id;
      }

      if (page === 1) {
        if (state.noMore) return;

        return scrollToTop();
      }
    } finally {
      state.loading = false;
    }
  };

  const reload = () => {
    state.page = 1;
    state.noMore = false;

    return fetchData();
  };

  const loadMore = () => {
    if (state.noMore) return;

    state.page += 1;

    fetchData();
  };

  useTauriListen(LISTEN_KEY.REFRESH_CLIPBOARD_LIST, reload);

  useAsyncEffect(async () => {
    await reload();

    rootState.activeId = rootState.list[0]?.id;
  }, [rootState.group, rootState.search]);

  return {
    loadMore,
    reload,
  };
};
