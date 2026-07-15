import { type FC, useContext } from "react";
import { Marker } from "react-mark.js";
import { MainContext } from "@/pages/Main";
import type { DatabaseSchemaHistory } from "@/types/database";

const Text: FC<DatabaseSchemaHistory<"text">> = (props) => {
  const { search, value } = props;
  const { rootState } = useContext(MainContext);
  const text = search ?? value;

  return (
    <div className="line-clamp-4">
      <Marker mark={rootState.search}>{text}</Marker>
    </div>
  );
};

export default Text;
