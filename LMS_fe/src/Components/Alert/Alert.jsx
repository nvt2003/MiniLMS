import "./Alert.css";
import { useState, useEffect } from "react";
const Alert = ({
  isOpen,
  type = "info",
  mode = "alert",
  title,
  message,
  value = "",
  onClose,
  onConfirm,
  onCancel,
}) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value, isOpen]);

  if (!isOpen) return null;

  const colors = {
    success: "#4caf50",
    error: "#f44336",
    warning: "#ff9800",
    info: "#2196f3",
  };

  const canCloseByOverlay =
    mode === "alert" && (type === "success" || type === "info");

  const handleOverlayClick = () => {
    if (canCloseByOverlay) {
      onClose();
    }
  };

  const handleBoxClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="alert-overlay"
      onClick={() => canCloseByOverlay && onClose()}
    >
      <div className="alert-box" onClick={handleBoxClick}>
        <h3 style={{ color: colors[type] }}>{title}</h3>

        <p>{message}</p>

        {mode === "prompt" && (
          <input
            className="alert-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
        )}

        {mode === "alert" ? (
          <button style={{ background: colors[type] }} onClick={onClose}>
            OK
          </button>
        ) : (
          <div className="alert-actions">
            <button className="cancel-btn" onClick={onCancel}>
              Hủy
            </button>

            <button
              style={{ background: colors[type] }}
              onClick={() => onConfirm(mode === "prompt" ? input : true)}
            >
              Xác nhận
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
