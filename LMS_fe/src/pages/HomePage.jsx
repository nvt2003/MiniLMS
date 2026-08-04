import React, { useEffect, useState } from "react";
import { Editor, Frame } from "@craftjs/core";
import { Container } from "../Components/Crafts/Container";
import { Text } from "../Components/Crafts/Text";
import { CustomImage } from "../Components/Crafts/CustomImage";
import { getPageLayout } from "../services/settingApi";
import { Slider, SlideItem } from "../Components/Crafts/Slider";
import Navbar from "../Components/Navbar";

export default function HomePage() {
  const [jsonConfig, setJsonConfig] = useState(null);

  useEffect(() => {
    getPageLayout("homepage", "page_layout_config").then((layoutData) => {
      if (layoutData) {
        setJsonConfig(layoutData);
      }
    });
  }, []);

  if (!jsonConfig) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <Editor
        resolver={{
          Container,
          Text,
          CustomImage,
          Slider,
          SlideItem,
          Element: Container,
          Canvas: Container,
        }}
        enabled={false}
      >
        <Frame data={jsonConfig} />
      </Editor>
    </>
  );
}
