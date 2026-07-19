import { Editor } from "@tinymce/tinymce-react";
import api from "../services/api";

export default function TextEditor({ value, onChange, onImageUploaded }) {
  return (
    <Editor
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
      value={value}
      onEditorChange={onChange}
      init={{
        height: 500,

        plugins: ["image", "link", "lists", "table", "code"],

        toolbar: "undo redo | bold italic | image link | bullist numlist",

        images_upload_handler: async (blobInfo) => {
          const formData = new FormData();
          formData.append("image", blobInfo.blob());

          const res = await api.post("/lessonImages/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          onImageUploaded({
            id: res.data.id,
            url: res.data.url,
          });

          return res.data.url;
        },
      }}
    />
  );
}
