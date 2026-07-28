import { useState, useEffect } from "react";

/**
 * Custom hook hoãn cập nhật giá trị cho đến khi người dùng ngừng gõ sau 1 khoảng thời gian
 * @param {any} value - Giá trị cần debounce 
 * @param {number} delay - Thời gian chờ tính bằng ms (mặc định 500ms)
 */
export default function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập một timer để cập nhật value sau khoảng delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: Hủy timer nếu value hoặc delay thay đổi
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}