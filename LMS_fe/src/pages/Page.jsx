import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Editor, Frame } from "@craftjs/core";

import { Container } from "../Components/Crafts/Container";
import { Text } from "../Components/Crafts/Text";
import { CustomImage } from "../Components/Crafts/CustomImage";
import Navbar from "../Components/Navbar";
import { getPageLayout } from "../services/settingApi";
import { Slider, SlideItem } from "../Components/Crafts/Slider";
export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await getPageLayout(
          `${slug || "homepage"}`,
          "page_layout_config",
        );
        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        setPage(res);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

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
        <Frame data={page} />
      </Editor>
    </>
  );
}
