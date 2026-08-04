import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ColorPickerModal } from "./ColorPickerModal";

export const Text = ({
  text,
  fontSize,
  color,
  background,
  fontFamily,
  textAlign,
  fontWeight,
  lineHeight,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <p
        className={`whitespace-pre-line ${fontSize} ${color} ${background} ${fontFamily} ${textAlign} ${fontWeight} ${lineHeight}`}
      >
        {text}
      </p>
    </div>
  );
};

// Cấu hình mặc định & Bảng điều khiển thuộc tính cho Text
Text.craft = {
  defaultProps: {
    text: "Nhập nội dung ở đây...",
    fontSize: "text-base",
    color: "text-gray-800",
    background: "bg-transparent",
    fontFamily: "font-sans",
    textAlign: "text-left",
    fontWeight: "font-normal",
    lineHeight: "leading-normal",
  },
  related: {
    // Component hiển thị trong Settings Panel khi click vào chữ này
    settings: TextSettings,
  },
};

function TextSettings() {
  // const {
  //   actions: { setProp },
  //   text,
  //   fontSize,
  //   color,
  //   background,
  // } = useNode((node) => ({
  //   text: node.data.props.text,
  //   fontSize: node.data.props.fontSize,
  //   color: node.data.props.color,
  //   background: node.data.props.background,
  // }));
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
    <div className="p-4 flex flex-col gap-3 text-sm">
      <div>
        <label className="font-semibold">Nội dung text</label>
        <textarea
          type="text"
          value={props.text}
          onChange={(e) => setProp((props) => (props.text = e.target.value))}
          className="p-2 border rounded"
        />
      </div>
      <div>
        <label className="font-semibold block mb-1 text-gray-700">Căn lề</label>
        <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded">
          {[
            { label: "Trái", value: "text-left" },
            { label: "Giữa", value: "text-center" },
            { label: "Phải", value: "text-right" },
            { label: "Đều", value: "text-justify" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setProp((props) => (props.textAlign = item.value))}
              className={`py-1 rounded text-[10px] font-medium transition-colors ${
                props.textAlign === item.value
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="font-semibold block mb-1 text-gray-700">
          Font chữ
        </label>
        <select
          value={props.fontFamily || "font-sans"}
          onChange={(e) => setProp((p) => (p.fontFamily = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="font-sans">Sans-serif</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Monospace</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold">Kích thước chữ</label>
        <select
          value={props.fontSize}
          onChange={(e) =>
            setProp((props) => (props.fontSize = e.target.value))
          }
          className="p-2 border rounded"
        >
          <option value="text-sm">Nhỏ</option>
          <option value="text-base">Vừa</option>
          <option value="text-2xl">Lớn</option>
        </select>
      </div>
      <div>
        <label className="font-semibold block mb-1 text-gray-700">Độ đậm</label>
        <select
          value={props.fontWeight || "font-normal"}
          onChange={(e) => setProp((p) => (p.fontWeight = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="font-normal">Thường</option>
          <option value="font-semibold">Bán đậm</option>
          <option value="font-bold">Đậm</option>
        </select>
      </div>
      <div>
        <label className="font-semibold block mb-1 text-gray-700">
          Khoảng cách dòng
        </label>
        <select
          value={props.lineHeight || "leading-normal"}
          onChange={(e) => setProp((p) => (p.lineHeight = e.target.value))}
          className="w-full p-2 border rounded bg-white"
        >
          <option value="leading-tight">Nhỏ</option>
          <option value="leading-normal">Vừa</option>
          <option value="leading-relaxed">Thoáng</option>
        </select>
      </div>
      <div>
        <label className="font-semibold block mb-1">Màu nền</label>
        <ColorPickerModal
          label="Màu nền"
          value={props.background}
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
          value={props.color}
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
