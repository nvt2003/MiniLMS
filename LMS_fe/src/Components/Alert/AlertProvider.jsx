import { useState } from "react";
import AlertContext from "./AlertContext";
import Alert from "./Alert";

export default function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    isOpen: false,
    mode: "alert",
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showAlert = (type, title, message) => {
    setAlert({
      isOpen: true,
      mode: "alert",
      type,
      title,
      message,
      onConfirm: null,
    });
  };

  const confirm = (title, message, onConfirm, type = "warning") => {
    setAlert({
      isOpen: true,
      mode: "confirm",
      type,
      title,
      message,
      onConfirm,
    });
  };

  const close = () =>
    setAlert((prev) => ({
      ...prev,
      isOpen: false,
    }));

  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    close();
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        confirm,

        success: (msg, title = "Thành công") =>
          showAlert("success", title, msg),

        error: (msg, title = "Lỗi") => showAlert("error", title, msg),

        warning: (msg, title = "Cảnh báo") => showAlert("warning", title, msg),

        info: (msg, title = "Thông báo") => showAlert("info", title, msg),
      }}
    >
      {children}

      <Alert
        {...alert}
        onClose={close}
        onCancel={close}
        onConfirm={handleConfirm}
      />
    </AlertContext.Provider>
  );
}
