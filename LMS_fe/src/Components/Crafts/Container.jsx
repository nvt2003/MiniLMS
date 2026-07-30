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
  const getLayoutClasses = () => {
    if (layout === "flex-row")
      return `flex flex-row flex-wrap ${alignItems} ${gap}`;
    if (layout === "grid") return `grid ${cols} ${gap}`;
    return "flex flex-col";
  };
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      // onClick={(e) => {
      //   e.stopPropagation();
      //   selectNode(id);
      // }}
      className={`min-h-[60px] transition-all relative ${getLayoutClasses()} ${
        selected
          ? "outline outline-2 outline-blue-500"
          : "border border-dashed border-gray-300"
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
          <select
            value={props.cols || "grid-cols-3"}
            onChange={(e) => setProp((p) => (p.cols = e.target.value))}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="grid-cols-2">2 Cột</option>
            <option value="grid-cols-3">3 Cột</option>
            <option value="grid-cols-4">4 Cột</option>
          </select>
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
            <option value="gap-2">Nhỏ (8px)</option>
            <option value="gap-4">Vừa (16px)</option>
            <option value="gap-8">Lớn (32px)</option>
            <option value="justify-between">Căn đều</option>
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
  },
  related: {
    settings: ContainerSettings,
  },
};
