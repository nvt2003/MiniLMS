import React from "react";
import { useNode } from "@craftjs/core";

export const Container = ({ background, padding, children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`min-h-[100px] border border-dashed border-gray-300 cursor-move transition-all ${background || "bg-white"} ${padding || "p-4"}`}
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
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <label className="font-semibold block mb-1">Màu nền</label>
        <select
          value={props.background}
          onChange={(e) => setProp((p) => (p.background = e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="bg-white">Trắng</option>
          <option value="bg-gray-100">Xám nhạt</option>
          <option value="bg-blue-50">Xanh nhạt</option>
          <option value="bg-amber-50">Vàng nhạt</option>
          <option value="bg-transparent">Trong suốt</option>
        </select>
      </div>

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
