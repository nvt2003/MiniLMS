import { useEffect, useState } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { Container } from "../../Components/Crafts/Container";
import { Text } from "../../Components/Crafts/Text";
import { Toolbox } from "../../Components/Crafts/Toolbox";
import { SettingsPanel } from "../../Components/Crafts/SettingsPanel";
import { savePageLayout } from "../../services/settingApi";
import { CustomImage } from "../../Components/Crafts/CustomImage";
import useAlert from "../../Components/Alert/useAlert";
import { Topbar } from "./Topbar";
import { PageDataLoader } from "./PageDataLoader";

// Component nút Lưu dữ liệu
const SaveButton = () => {
  const { showAlert } = useAlert();
  const { query } = useEditor();

  const handleSave = async () => {
    try {
      const jsonState = query.serialize();
      await savePageLayout(jsonState, "homepage");
      showAlert("success", "", "Lưu giao diện thành công!");
    } catch (error) {
      console.error("Lỗi lưu giao diện:", error);
    }
  };

  return (
    <button
      onClick={handleSave}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Lưu Giao Diện
    </button>
  );
};

export default function AdminBuilder() {
  const [activeGroup, setActiveGroup] = useState("homepage");
  return (
    <Editor
      resolver={{
        Container,
        Text,
        CustomImage,
      }}
    >
      {/* thanh công cụ */}
      <Topbar activeSlug={activeGroup} setActiveSlug={setActiveGroup} />

      <div className="flex flex-col h-screen">
        {/* Topbar */}
        <div className="h-14 border-b bg-white flex justify-between items-center px-4">
          <h1 className="font-bold">Visual Page Builder</h1>
          <SaveButton />
        </div>

        {/* Main Workspace */}
        <div className="flex flex 1 overflow-hidden">
          <Toolbox />

          {/* Màn hình Preview / Canvas */}
          <div className="flex-1 p-8 bg-gray-100 overflow-y-auto">
            <div className="bg-white shadow-md max-w-4xl mx-auto min-h-[600px]">
              <PageDataLoader activeSlug={activeGroup} />
            </div>
          </div>

          <SettingsPanel />
        </div>
      </div>
    </Editor>
  );
}
