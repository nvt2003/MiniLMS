import React, { useEffect, useState } from "react";
import { useEditor, Frame } from "@craftjs/core";
import { Container } from "../../Components/Crafts/Container";
import { Text } from "../../Components/Crafts/Text";
import { getPageLayout } from "../../services/settingApi";

const sanitizeJson = (jsonObj) => {
  if (!jsonObj) return null;
  const str = typeof jsonObj === "string" ? jsonObj : JSON.stringify(jsonObj);
  return str
    .replaceAll('"resolvedName":"Canvas"', '"resolvedName":"Container"')
    .replaceAll('"resolvedName":"Element"', '"resolvedName":"Container"');
};
const EMPTY_STATE = JSON.stringify({
  ROOT: {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {},
    displayName: "Container",
    custom: {},
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});
export const PageDataLoader = ({ activeSlug }) => {
  const { actions } = useEditor();

  useEffect(() => {
    async function load() {
      if (!activeSlug) return;
      try {
        const layoutData = await getPageLayout(
          activeSlug,
          "page_layout_config",
        );
        let parsedData = layoutData;
        if (typeof layoutData === "string") {
          try {
            parsedData = JSON.parse(layoutData);
          } catch {
            parsedData = null;
          }
        }
        //Bắt các trường hợp dữ liệu RỖNG: null, undefined, hoặc Object {}
        const isEmpty =
          !parsedData ||
          (typeof parsedData === "object" &&
            Object.keys(parsedData).length === 0);

        if (isEmpty) {
          // Nạp Canvas rỗng chứa ROOT Node
          actions.deserialize(EMPTY_STATE);
          return;
        }

        const cleanJson = sanitizeJson(layoutData);
        actions.deserialize(cleanJson);
      } catch (err) {
        console.error("Lỗi nạp layout:", err);
        actions.deserialize(EMPTY_STATE);
      }
    }

    load();
  }, [activeSlug, actions]);

  return null;
};
