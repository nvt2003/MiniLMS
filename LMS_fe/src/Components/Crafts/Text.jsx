import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ColorPickerModal } from "./ColorPickerModal";

export const Text = ({ text, fontSize, color, background }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p className={`${fontSize} ${color} ${background}`}>{text}</p>
    </div>
  );
};

// Cấu hình mặc định & Bảng điều khiển thuộc tính cho Text
Text.craft = {
  defaultProps: {
    text: "Nhập nội dung ở đây...",
    fontSize: "text-base",
    color: "text-gray-800",
    background: "bg-white",
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
    background,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    color: node.data.props.color,
    background: node.data.props.background,
  }));
  const { id } = useNode();
  const { actions: editorActions } = useEditor();

  const handleDelete = () => {
    editorActions.delete(id);
  };
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
      <div>
        <label className="font-semibold block mb-1">Màu nền</label>
        <ColorPickerModal
          label="Màu nền"
          value={background}
          onChange={(colorClass) =>
            setProp((props) => (props.background = colorClass))
          }
        />
      </div>

      <div>
        <label className="font-semibold block mb-1">Màu chữ</label>
        <ColorPickerModal
          label="Màu chữ"
          isText={true}
          onChange={(colorClass) =>
            setProp((props) => (props.color = colorClass))
          }
          value={color}
        />
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
