import {
  Alert,
  Button,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  message,
  Segmented,
  Select,
  Typography,
  theme,
} from "antd";
import {
  type CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { writeText } from "tauri-plugin-clipboard-x-api";
import UnoIcon from "@/components/UnoIcon";
import {
  convertRadix,
  convertUnit,
  convertUrl,
  formatZonedDate,
  parseTimestamp,
  parseZonedDate,
  radixOptionList,
  timeZoneList,
  unitCategoryList,
} from "@/utils/toolbox";
import { MainContext } from "../..";
import styles from "./index.module.scss";

const toolList = [
  {
    icon: "i-lucide:clock-3",
    key: "timestamp",
    label: "时间戳转换",
  },
  {
    icon: "i-lucide:globe",
    key: "timezone",
    label: "时区转换",
  },
  {
    icon: "i-lucide:ruler",
    key: "unit",
    label: "单位换算",
  },
  {
    icon: "i-lucide:binary",
    key: "radix",
    label: "进制转换",
  },
  {
    icon: "i-lucide:link",
    key: "url",
    label: "URL编解码",
  },
];

const Toolbox = () => {
  const { rootState } = useContext(MainContext);
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const [tool, setTool] = useState("timestamp");
  const toolTabsRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState("timestamp");
  const [timestamp, setTimestamp] = useState(() => String(Date.now()));
  const [timestampUnit, setTimestampUnit] = useState<"s" | "ms">("ms");
  const [date, setDate] = useState(() => formatZonedDate(Date.now(), "UTC+8"));
  const [sourceZone, setSourceZone] = useState("UTC+8");
  const [targetZone, setTargetZone] = useState("UTC-8");
  const [zoneDate, setZoneDate] = useState(() =>
    formatZonedDate(Date.now(), "UTC+8"),
  );
  const [category, setCategory] = useState("length");
  const [sourceUnit, setSourceUnit] = useState("cm");
  const [targetUnit, setTargetUnit] = useState("in");
  const [quantity, setQuantity] = useState("1");
  const [url, setUrl] = useState("");
  const [radix, setRadix] = useState(10);
  const [radixValue, setRadixValue] = useState("");
  const [urlAction, setUrlAction] = useState<"encode" | "decode">("decode");
  const [urlMode, setUrlMode] = useState<"component" | "uri" | "form">(
    "component",
  );
  const unitList = unitCategoryList.find(
    (item) => item.value === category,
  )!.unitList;

  const scrollActiveToolIntoView = () => {
    toolTabsRef.current
      ?.querySelector(".ant-segmented-item-selected")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  useEffect(scrollActiveToolIntoView, [tool]);

  const getResult = (): { label: string; value: string }[] => {
    switch (tool) {
      case "timestamp": {
        const value = direction === "timestamp" ? timestamp : date;
        if (!value.trim()) return [];
        const milliseconds =
          direction === "timestamp"
            ? parseTimestamp(timestamp, timestampUnit)
            : parseZonedDate(date, sourceZone);
        return [
          {
            label: `当前时间(${sourceZone})`,
            value: formatZonedDate(milliseconds, sourceZone),
          },
          {
            label: "UTC",
            value: formatZonedDate(milliseconds, "UTC+0"),
          },
          {
            label: "秒时间戳(s)",
            value: String(Math.floor(milliseconds / 1000)),
          },
          { label: "毫秒时间戳(ms)", value: String(milliseconds) },
        ];
      }
      case "timezone":
        return zoneDate.trim()
          ? [
              {
                label: `目标时间(${targetZone})`,
                value: formatZonedDate(
                  parseZonedDate(zoneDate, sourceZone),
                  targetZone,
                ),
              },
            ]
          : [];
      case "unit":
        return quantity.trim()
          ? [
              {
                label: `换算结果·${unitList.find((item) => item.value === targetUnit)!.label}`,
                value: convertUnit(quantity, category, sourceUnit, targetUnit),
              },
            ]
          : [];
      case "radix":
        return radixValue.trim() ? convertRadix(radixValue, radix) : [];
      default:
        return url
          ? [
              {
                label: urlAction === "encode" ? "编码结果" : "解码结果",
                value: convertUrl(url, urlAction, urlMode),
              },
            ]
          : [];
    }
  };

  let resultList: { label: string; value: string }[] = [];
  let error = "";
  try {
    resultList = getResult();
  } catch (cause) {
    error = (cause as Error).message;
  }

  const zoneSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
  ) => (
    <Select
      aria-label={label}
      className={styles.fullWidth}
      onChange={onChange}
      optionFilterProp="label"
      options={timeZoneList}
      showSearch
      value={value}
    />
  );

  return (
    <>
      <Dropdown
        menu={{
          items: toolList.map((item) => ({
            icon: <UnoIcon name={item.icon} />,
            key: item.key,
            label: item.label,
          })),
          onClick: ({ key }) => {
            setTool(key);
            rootState.pinned = true;
            rootState.toolboxOpen = true;
          },
        }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <Button
          aria-label="打开工具菜单"
          className={styles.trigger}
          size="small"
          type="text"
        >
          工具
        </Button>
      </Dropdown>
      <Modal
        afterOpenChange={(open) => {
          if (open) scrollActiveToolIntoView();
        }}
        centered
        footer={null}
        modalRender={(node) => (
          <div
            data-toolbox-panel
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                rootState.toolboxOpen = false;
                rootState.pinned = false;
              }
            }}
          >
            {node}
          </div>
        )}
        onCancel={() => {
          rootState.toolboxOpen = false;
          rootState.pinned = false;
        }}
        open={rootState.toolboxOpen ?? false}
        styles={{
          body: { maxHeight: "calc(100dvh - 120px)", overflowY: "auto" },
        }}
        title="随手工具"
        width="min(480px, calc(100vw - 24px))"
      >
        <div
          className={styles.panel}
          style={
            {
              "--toolbox-accent": token.colorPrimary,
              "--toolbox-border": token.colorBorderSecondary,
              "--toolbox-surface": token.colorFillAlter,
            } as CSSProperties
          }
        >
          <div className={styles.toolTabs} ref={toolTabsRef}>
            <Segmented
              onChange={setTool}
              options={toolList.map((item) => ({
                label:
                  item.key === "timestamp"
                    ? "时间戳"
                    : item.key === "timezone"
                      ? "时区"
                      : item.key === "unit"
                        ? "单位"
                        : item.key === "radix"
                          ? "进制"
                          : "URL",
                value: item.key,
              }))}
              value={tool}
            />
          </div>
          <Form layout="vertical">
            {tool === "timestamp" && (
              <>
                <Form.Item>
                  <Segmented
                    block
                    onChange={setDirection}
                    options={[
                      { label: "时间戳 → 日期", value: "timestamp" },
                      { label: "日期 → 时间戳", value: "date" },
                    ]}
                    value={direction}
                  />
                </Form.Item>
                {direction === "timestamp" ? (
                  <Form.Item label="时间戳">
                    <Flex gap={8}>
                      <Input
                        aria-label="时间戳"
                        onChange={(event) => setTimestamp(event.target.value)}
                        placeholder="输入秒或毫秒时间戳"
                        value={timestamp}
                      />
                      <Select
                        aria-label="时间戳单位"
                        className={styles.timestampUnit}
                        onChange={setTimestampUnit}
                        options={[
                          { label: "秒(s)", value: "s" },
                          { label: "毫秒(ms)", value: "ms" },
                        ]}
                        value={timestampUnit}
                      />
                    </Flex>
                  </Form.Item>
                ) : (
                  <Form.Item label="日期时间">
                    <Input
                      aria-label="日期时间"
                      onChange={(event) => setDate(event.target.value)}
                      placeholder="yyyy-MM-dd HH:mm:ss"
                      value={date}
                    />
                  </Form.Item>
                )}
                <Form.Item label="日期所属时区">
                  {zoneSelect(sourceZone, setSourceZone, "日期所属时区")}
                </Form.Item>
                <Button
                  onClick={() => {
                    const now = Date.now();
                    setTimestamp(
                      String(
                        timestampUnit === "s" ? Math.floor(now / 1000) : now,
                      ),
                    );
                    setDate(formatZonedDate(now, sourceZone));
                  }}
                >
                  使用当前时间
                </Button>
              </>
            )}
            {tool === "timezone" && (
              <>
                <Form.Item label="原始时间">
                  <Input
                    aria-label="原始时间"
                    onChange={(event) => setZoneDate(event.target.value)}
                    placeholder="yyyy-MM-dd HH:mm:ss"
                    value={zoneDate}
                  />
                </Form.Item>
                <Form.Item label="原始时区">
                  {zoneSelect(sourceZone, setSourceZone, "原始时区")}
                </Form.Item>
                <Form.Item label="目标时区">
                  {zoneSelect(targetZone, setTargetZone, "目标时区")}
                </Form.Item>
                <Flex gap={8}>
                  <Button
                    onClick={() =>
                      setZoneDate(formatZonedDate(Date.now(), sourceZone))
                    }
                  >
                    使用当前时间
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        if (zoneDate.trim())
                          setZoneDate(
                            formatZonedDate(
                              parseZonedDate(zoneDate, sourceZone),
                              targetZone,
                            ),
                          );
                        setSourceZone(targetZone);
                        setTargetZone(sourceZone);
                      } catch (cause) {
                        messageApi.error((cause as Error).message);
                      }
                    }}
                  >
                    交换时区
                  </Button>
                </Flex>
              </>
            )}
            {tool === "unit" && (
              <>
                <Form.Item label="换算类别">
                  <Select
                    aria-label="换算类别"
                    onChange={(value) => {
                      const nextUnitList = unitCategoryList.find(
                        (item) => item.value === value,
                      )!.unitList;
                      setCategory(value);
                      setSourceUnit(nextUnitList[0].value);
                      setTargetUnit(nextUnitList[1].value);
                    }}
                    options={unitCategoryList.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                    value={category}
                  />
                </Form.Item>
                <Form.Item label="数值">
                  <Input
                    aria-label="换算数值"
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="输入数值，支持小数"
                    value={quantity}
                  />
                </Form.Item>
                <div className={styles.unitGrid}>
                  <Form.Item label="原始单位">
                    <Select
                      aria-label="原始单位"
                      onChange={setSourceUnit}
                      options={unitList}
                      value={sourceUnit}
                    />
                  </Form.Item>
                  <Button
                    aria-label="交换单位"
                    className={styles.swap}
                    icon={<UnoIcon name="i-lucide:arrow-left-right" />}
                    onClick={() => {
                      setSourceUnit(targetUnit);
                      setTargetUnit(sourceUnit);
                    }}
                  />
                  <Form.Item label="目标单位">
                    <Select
                      aria-label="目标单位"
                      onChange={setTargetUnit}
                      options={unitList}
                      value={targetUnit}
                    />
                  </Form.Item>
                </div>
              </>
            )}
            {tool === "radix" && (
              <>
                <Form.Item label="输入进制">
                  <Select
                    aria-label="输入进制"
                    onChange={setRadix}
                    options={radixOptionList}
                    value={radix}
                  />
                </Form.Item>
                <Form.Item label="整数">
                  <Input
                    aria-label="进制转换整数"
                    autoComplete="off"
                    onChange={(event) => setRadixValue(event.target.value)}
                    placeholder="输入整数，例如255、FF或0xFF"
                    value={radixValue}
                  />
                </Form.Item>
                <Typography.Text type="secondary">
                  支持正负整数及所选进制的0b、0o、0x前缀，大整数转换不丢失精度。
                </Typography.Text>
              </>
            )}
            {tool === "url" && (
              <>
                <Form.Item>
                  <Segmented
                    block
                    onChange={setUrlAction}
                    options={[
                      { label: "解码Decode", value: "decode" },
                      { label: "编码Encode", value: "encode" },
                    ]}
                    value={urlAction}
                  />
                </Form.Item>
                <Form.Item label="处理模式">
                  <Select
                    aria-label="URL处理模式"
                    onChange={setUrlMode}
                    options={[
                      {
                        label: "参数值·encodeURIComponent",
                        value: "component",
                      },
                      { label: "完整地址·encodeURI", value: "uri" },
                      { label: "表单参数·空格与+互转", value: "form" },
                    ]}
                    value={urlMode}
                  />
                </Form.Item>
                <Form.Item label="输入内容">
                  <Input.TextArea
                    aria-label="URL输入内容"
                    autoSize={{ maxRows: 6, minRows: 3 }}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder={
                      urlAction === "decode"
                        ? "%E4%BD%A0%E5%A5%BD"
                        : "输入需要编码的文字或URL"
                    }
                    value={url}
                  />
                </Form.Item>
              </>
            )}
          </Form>
          <div aria-live="polite" className={styles.results}>
            {error ? (
              <Alert message={error} showIcon type="warning" />
            ) : resultList.length ? (
              resultList.map((item) => (
                <div className={styles.result} key={item.label}>
                  <Flex align="center" gap={8} justify="space-between">
                    <Typography.Text type="secondary">
                      {item.label}
                    </Typography.Text>
                    <Button
                      onClick={async () => {
                        try {
                          await writeText(item.value);
                          messageApi.success("已复制");
                        } catch {
                          messageApi.error("复制失败，请重试");
                        }
                      }}
                      size="small"
                      type="text"
                    >
                      复制
                    </Button>
                  </Flex>
                  <div className={styles.value}>{item.value}</div>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </Modal>
      {contextHolder}
    </>
  );
};

export default Toolbox;
