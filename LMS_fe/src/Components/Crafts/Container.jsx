import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ColorPickerModal } from "./ColorPickerModal";

export const Container = ({
  background,
  padding,
  layout = "block",
  cols = "grid-cols-3",
  gap = "gap-4",
  alignItems = "items-center",
  justifyContent = "justify-start",
  children,
}) => {
  const {
    id,
    connectors: { connect, drag },

    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));
  const {
    actions: { selectNode },
  } = useEditor();

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  };
  const getLayoutClasses = () => {
    if (layout === "flex-row") {
      return `flex flex-row flex-wrap ${justifyContent} ${alignItems} ${gap}`;
    }

    if (layout === "flex-col") {
      return `flex flex-col ${justifyContent} ${alignItems} ${gap}`;
    }

    if (layout === "grid") {
      return `grid ${gridCols[cols] || "grid-cols-3"} ${gap}`;
    }

    return `flex flex-col ${justifyContent} ${alignItems} ${gap}`;
  };
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      // onClick={(e) => {
      //   e.stopPropagation();
      //   selectNode(id);
      // }}
      className={`w-full max-w-full min-h-[60px] transition-all relative ${getLayoutClasses()} ${
        selected
          ? "outline outline-2 outline-blue-500"
          : `${enabled ? "border border-dashed border-gray-300" : ""}`
      } ${background || "bg-white"} ${padding || "p-4"}`}
    >
      {children}
    </div>
  );
};
function ContainerSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));
  const { id } = useNode();
  const { actions: editorActions } = useEditor();

  const handleDelete = () => {
    editorActions.delete(id);
  };
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <label className="font-semibold block mb-1">Màu nền</label>
        <ColorPickerModal
          label="Màu nền"
          value={props.background}
          onChange={(colorClass) => setProp((p) => (p.background = colorClass))}
        />
      </div>
      <div>
        <label>{props.layout === "flex-col" ? "Căn dọc" : "Căn ngang"}</label>
        <select
          value={props.justifyContent}
          onChange={(e) => setProp((p) => (p.justifyContent = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="justify-start">Trái</option>
          <option value="justify-center">Giữa</option>
          <option value="justify-end">Phải</option>
          <option value="justify-between">Giãn đều</option>
        </select>
      </div>
      <div>
        <label>{props.layout === "flex-col" ? "Căn ngang" : "Căn dọc"}</label>
        <select
          value={props.alignItems}
          onChange={(e) => setProp((p) => (p.alignItems = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="items-start">Trên</option>
          <option value="items-center">Giữa</option>
          <option value="items-end">Dưới</option>
          <option value="items-stretch">Kéo giãn</option>
        </select>
      </div>
      <div>
        <label className="font-semibold block mb-1 text-gray-700">
          Bố trí (Layout)
        </label>
        <select
          value={props.layout || "block"}
          onChange={(e) => setProp((p) => (p.layout = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="block">Dọc / Xếp lớp</option>
          <option value="flex-row">Hàng ngang</option>
          <option value="grid">Lưới / Cột</option>
        </select>
      </div>
      {props.layout === "grid" && (
        <div>
          <label className="font-semibold block mb-1 text-gray-700">
            Số cột chia
          </label>
          {/* <select
            value={props.cols || "grid-cols-3"}
            onChange={(e) => setProp((p) => (p.cols = e.target.value))}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="grid-cols-2">2 Cột</option>
            <option value="grid-cols-3">3 Cột</option>
            <option value="grid-cols-4">4 Cột</option>
          </select> */}
          <input
            type="number"
            min={1}
            max={12}
            value={props.cols || 3}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setProp((p) => (p.cols = val));
            }}
            className="w-full p-2 border rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Nhập số cột (VD: 3)"
          />
        </div>
      )}
      {(props.layout === "flex-row" || props.layout === "grid") && (
        <div>
          <label className="font-semibold block mb-1 text-gray-700">
            Khoảng cách giữa phần tử (Gap)
          </label>
          <select
            value={props.gap || "gap-4"}
            onChange={(e) => setProp((p) => (p.gap = e.target.value))}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="gap-2">Nhỏ</option>
            <option value="gap-4">Vừa</option>
            <option value="gap-8">Lớn</option>
            <option value="gap-12">Rất lớn</option>
          </select>
        </div>
      )}
      <div>
        <label className="font-semibold block mb-1">
          Khoảng cách lề (Padding)
        </label>
        <select
          value={props.padding}
          onChange={(e) => setProp((p) => (p.padding = e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="p-2">Nhỏ (p-2)</option>
          <option value="p-4">Vừa (p-4)</option>
          <option value="p-8">Lớn (p-8)</option>
          <option value="p-0">Không lề (p-0)</option>
        </select>
      </div>
      <div className="pt-4 mt-4 border-t">
        <button
          onClick={handleDelete}
          className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold flex items-center justify-center gap-1"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
Container.craft = {
  isCanvas: true, // Cho phép thả các component khác vào bên trong Container này
  defaultProps: {
    background: "bg-white",
    padding: "p-4",
    layout: "flex-col",
    cols: 3,
    gap: "gap-4",
    justifyContent: "justify-start",
    alignItems: "items-start",
  },
  related: {
    settings: ContainerSettings,
  },
};
