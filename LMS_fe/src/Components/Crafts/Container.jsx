import React from "react";
import { useNode } from "@craftjs/core";

export const Container = ({ background, padding, children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`min-h-[100px] border border-dashed border-gray-300 ${background} ${padding}`}
    >
      {children}
    </div>
  );
};

Container.craft = {
  isCanvas: true, // Cho phép thả các component khác vào bên trong Container này
  defaultProps: {
    background: "bg-white",
    padding: "p-4",
  },
};
