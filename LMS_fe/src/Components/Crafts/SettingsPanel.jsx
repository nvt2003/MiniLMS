import React from "react";
import { useEditor } from "@craftjs/core";

export const SettingsPanel = () => {
  const { selected } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
      };
    }

    return { selected };
  });

  return selected && selected.settings ? (
    <div className="w-64 p-4 border-l bg-gray-50">
      <h3 className="font-bold border-b pb-2 mb-2">
        Chỉnh sửa: {selected.name}
      </h3>
      {React.createElement(selected.settings)}
    </div>
  ) : (
    <div className="w-64 p-4 border-l bg-gray-50 text-gray-400">
      Click vào 1 phần tử trên màn hình để chỉnh sửa.
    </div>
  );
};
