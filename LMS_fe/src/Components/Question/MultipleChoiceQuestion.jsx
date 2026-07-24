import React from "react";

const MultipleChoiceQuestion = ({
  question,
  currentAnswer,
  onAnswerChange,
}) => {
  // Đảm bảo selectedOptionIds luôn là mảng dạng Number để so sánh chuẩn
  const selectedOptionIds = Array.isArray(currentAnswer?.selected_option_ids)
    ? currentAnswer.selected_option_ids.map(Number)
    : [];

  const handleToggle = (optId) => {
    const numericOptId = Number(optId);
    let updatedIds = [];

    if (selectedOptionIds.includes(numericOptId)) {
      // Nếu đã chọn -> bỏ chọn
      updatedIds = selectedOptionIds.filter((id) => id !== numericOptId);
    } else {
      // Nếu chưa chọn -> thêm vào mảng
      updatedIds = [...selectedOptionIds, numericOptId];
    }

    onAnswerChange(updatedIds);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-600 font-medium italic mb-2">
        * Chọn một hoặc nhiều đáp án đúng
      </p>

      {question.options?.map((opt) => {
        const optIdNum = Number(opt.id);
        const isSelected = selectedOptionIds.includes(optIdNum);

        return (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all select-none ${
              isSelected
                ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium shadow-sm"
                : "border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggle(opt.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="flex-1">{opt.content}</span>
          </label>
        );
      })}
    </div>
  );
};

export default MultipleChoiceQuestion;
