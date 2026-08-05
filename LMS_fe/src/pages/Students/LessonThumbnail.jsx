import React from "react";
import ImageModal from "../../Components/ImageModal";
const LessonThumbnail = ({ lesson, idx, isCompleted }) => {
  return (
    <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
      <ImageModal
        src={lesson.thumbnail_url}
        width="80"
        height="48"
        alt={lesson.title}
        className="w-full h-full object-cover"
      />

      {/* Badge số thứ tự */}
      <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
        {idx + 1}
      </div>

      {/* Badge hoàn thành */}
      {isCompleted && (
        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
          ✓
        </div>
      )}
    </div>
  );
};

export default React.memo(LessonThumbnail);
