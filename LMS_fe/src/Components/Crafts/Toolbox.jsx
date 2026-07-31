import React from "react";
import { useEditor } from "@craftjs/core";
import { Text } from "./Text";
import { Container } from "./Container";
import { CustomImage } from "./CustomImage";

export const Toolbox = () => {
  const { connectors, actions, query } = useEditor();
  const addComponentToRoot = (reactElement) => {
    try {
      // 1. Lấy tất cả các node hiện có trong editor
      const nodes = query.getNodes();
      console.log("Danh sách node hiện tại:", query.getNodes());

      // 2. Tìm node gốc (node không có parent)
      const rootNodeId =
        Object.keys(nodes).find((id) => !nodes[id].data.parent) || "ROOT";

      if (!rootNodeId) {
        console.warn("Chưa tìm thấy node gốc nào trong Canvas.");
        return;
      }
      const nodeTree = query.parseReactElement(reactElement).toNodeTree();
      actions.addNodeTree(nodeTree, "ROOT");
    } catch (error) {
      console.error("Lỗi khi thêm phần tử:", error);
    }
  };
  return (
    <div className="w-64 p-4 border-r bg-gray-50 flex flex-col gap-2">
      <h3 className="font-bold mb-2">Thêm thành phần</h3>
      {/* 1. Thẻ Text */}
      <div className="flex gap-1">
        <button
          ref={(ref) => connectors.create(ref, <Text text="Đoạn văn mới" />)}
          className="p-2 bg-white border rounded shadow-sm hover:bg-gray-100 text-left"
        >
          Văn bản
        </button>
        <button
          onClick={() => addComponentToRoot(<Text text="Đoạn văn mới" />)}
          className="px-2 bg-blue-50 border border-blue-200 text-blue-600 rounded text-xs hover:bg-blue-100"
          title="Bấm để chèn nhanh"
        >
          + Thêm
        </button>
      </div>
      {/* 2. Thẻ Container */}
      <div className="flex gap-1">
        <button
          ref={(ref) =>
            connectors.create(
              ref,
              <Container padding="p-4" background="bg-white" />,
            )
          }
          className="p-2 bg-white border rounded shadow-sm hover:bg-gray-100 text-left"
        >
          Khung Container
        </button>
        <button
          onClick={() =>
            addComponentToRoot(
              <Container padding="p-4" background="bg-white" />,
            )
          }
          className="px-2 bg-blue-50 border border-blue-200 text-blue-600 rounded text-xs hover:bg-blue-100"
          title="Bấm để chèn nhanh"
        >
          + Thêm
        </button>
      </div>
      {/* 3. Thẻ Image */}
      <div className="flex gap-1">
        <button
          ref={(ref) => connectors.create(ref, <CustomImage />)}
          className="p-2 bg-white border rounded shadow-sm hover:bg-gray-100 text-left flex items-center gap-2"
        >
          Hình Ảnh
        </button>
        <button
          onClick={() => addComponentToRoot(<CustomImage />)}
          className="px-2 bg-blue-50 border border-blue-200 text-blue-600 rounded text-xs hover:bg-blue-100"
          title="Bấm để chèn nhanh"
        >
          + Thêm
        </button>
      </div>
    </div>
  );
};
