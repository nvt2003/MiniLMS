import { useEffect, useState } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { Container } from "../../Components/Crafts/Container";
import { Text } from "../../Components/Crafts/Text";
import { Toolbox } from "../../Components/Crafts/Toolbox";
import { SettingsPanel } from "../../Components/Crafts/SettingsPanel";
import { CustomImage } from "../../Components/Crafts/CustomImage";
import { Topbar } from "./Topbar";
import { PageDataLoader } from "./PageDataLoader";
import { Slider, SlideItem } from "../../Components/Crafts/Slider";

export default function AdminBuilder() {
  const [activeGroup, setActiveGroup] = useState("homepage");
  return (
    <Editor
      resolver={{
        Container,
        Text,
        CustomImage,
        Slider,
        SlideItem,
      }}
    >
      {/* thanh công cụ */}
      <Topbar activeSlug={activeGroup} setActiveSlug={setActiveGroup} />

      <div className="flex flex-col h-screen">
        {/* Topbar */}
        <div className="h-14 border-b bg-white flex justify-between items-center px-4">
          <h1 className="font-bold">Visual Page Builder</h1>
          {/* <SaveButton /> */}
        </div>
        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
          <Toolbox />

          {/* Màn hình Preview / Canvas */}
          <PageDataLoader activeSlug={activeGroup} />
          <div className="flex-1 p-8 bg-gray-100 overflow-y-auto">
            <div className="bg-white shadow-md max-w-4xl mx-auto min-h-[600px]">
              <Frame>
                <Element is={Container} canvas className="min-h-[600px]" />
              </Frame>
            </div>
          </div>

          <SettingsPanel />
        </div>
      </div>
    </Editor>
  );
}
