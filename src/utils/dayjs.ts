import dayjs, { type ConfigType } from "dayjs";
import "dayjs/locale/zh-cn";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.locale("zh-cn");

const formatDate = (date?: ConfigType, format = "YYYY-MM-DD HH:mm:ss") => {
  return dayjs(date).format(format);
};

export { dayjs, formatDate };
