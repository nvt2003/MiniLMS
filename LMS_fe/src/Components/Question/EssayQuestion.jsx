import React from "react";

const EssayQuestion = ({ question, currentAnswer, onAnswerChange }) => {
  const essayText = currentAnswer?.essay_answer || "";

  return (
    <div>
      <textarea
        rows={5}
        value={essayText}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Nhập chi tiết câu trả lời tự luận của bạn tại đây..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 resize-y"
      />
    </div>
  );
};

export default EssayQuestion;
