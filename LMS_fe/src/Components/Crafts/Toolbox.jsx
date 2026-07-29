import React from "react";
import { useEditor } from "@craftjs/core";
import { Text } from "./Text";
import { Container } from "./Container";

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-64 p-4 border-r bg-gray-50 flex flex-col gap-2">
      <h3 className="font-bold mb-2">Thêm phần tử</h3>
      <button
        ref={(ref) => connectors.create(ref, <Text text="Đoạn văn mới" />)}
        className="p-2 bg-white border rounded shadow-sm hover:bg-gray-100 text-left"
      >
        Thẻ Text
      </button>
      <button
        ref={(ref) => connectors.create(ref, <Element is={Container} canvas />)}
        className="p-2 bg-white border rounded shadow-sm hover:bg-gray-100 text-left"
      >
        Khung Container
      </button>
    </div>
  );
};
