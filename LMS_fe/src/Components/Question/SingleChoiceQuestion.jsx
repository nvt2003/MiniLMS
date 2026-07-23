import React from "react";

const SingleChoiceQuestion = ({ question, currentAnswer, onAnswerChange }) => {
  const selectedOptionId = currentAnswer?.selected_option_id;

  return (
    <div className="space-y-3">
      {question.options?.map((opt) => {
        const isSelected = Number(selectedOptionId) === Number(opt.id);

        return (
          <label
            key={opt.id}
            onClick={() => onAnswerChange(opt.id)}
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium shadow-sm"
                : "border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <input
              type="radio"
              name={`single-question-${question.question_id}`}
              checked={isSelected}
              onChange={() => {}} // Đã xử lý ở label onClick
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="flex-1">{opt.content}</span>
          </label>
        );
      })}
    </div>
  );
};

export default SingleChoiceQuestion;
