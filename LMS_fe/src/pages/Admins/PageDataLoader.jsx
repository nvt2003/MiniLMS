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

export const PageDataLoader = ({ activeSlug }) => {
  const { actions } = useEditor();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      try {
        const layoutData = await getPageLayout(
          activeSlug,
          "page_layout_config",
        );
        console.log("data: ", layoutData);

        if (layoutData) {
          const cleanJson = sanitizeJson(layoutData);
          actions.deserialize(cleanJson);
        } else {
          // Khởi tạo container trống nếu chưa có dữ liệu
          actions.deserialize(
            JSON.stringify({
              ROOT: {
                type: { resolvedName: "Container" },
                isCanvas: true,
                props: {},
                nodes: [],
              },
            }),
          );
        }
      } catch (error) {
        console.error(`Lỗi tải cấu hình group ${activeSlug}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [activeSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-medium text-xs">
        ⏳ Đang tải trang {activeSlug}...
      </div>
    );
  }

  return (
    <Frame>
      {/* <Container padding="p-6" background="bg-white">
        <Text text={`Chào mừng đến trang: ${activeSlug}`} fontSize="text-xl" />
      </Container> */}
    </Frame>
  );
};
