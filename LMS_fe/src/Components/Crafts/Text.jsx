import React from "react";
import { useNode } from "@craftjs/core";

export const Text = ({ text, fontSize, color }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p className={`${fontSize} ${color}`}>{text}</p>
    </div>
  );
};

// Cấu hình mặc định & Bảng điều khiển thuộc tính cho Text
Text.craft = {
  defaultProps: {
    text: "Nhập nội dung ở đây...",
    fontSize: "text-base",
    color: "text-gray-800",
  },
  related: {
    // Component hiển thị trong Settings Panel khi click vào chữ này
    settings: TextSettings,
  },
};

function TextSettings() {
  const {
    actions: { setProp },
    text,
    fontSize,
    color,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    color: node.data.props.color,
  }));

  return (
    <div className="p-4 flex flex-col gap-3">
      <label className="text-sm font-semibold">Nội dung text</label>
      <input
        type="text"
        value={text}
        onChange={(e) => setProp((props) => (props.text = e.target.value))}
        className="p-2 border rounded"
      />

      <label className="text-sm font-semibold">Kích thước chữ</label>
      <select
        value={fontSize}
        onChange={(e) => setProp((props) => (props.fontSize = e.target.value))}
        className="p-2 border rounded"
      >
        <option value="text-sm">Nhỏ</option>
        <option value="text-base">Vừa</option>
        <option value="text-2xl">Lớn (Heading)</option>
      </select>
    </div>
  );
}
