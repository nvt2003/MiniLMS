import { useState } from "react";
import AlertContext from "./AlertContext";
import Alert from "./Alert";

const defaults = {
  isOpen: false,
  mode: "alert",
  type: "info",
  title: "",
  message: "",
  value: "",
  onConfirm: null,
};
export default function AlertProvider({ children }) {
  const [alert, setAlert] = useState(defaults);

  // const showAlert = (type, title, message) => {
  //   setAlert({
  //     isOpen: true,
  //     mode: "alert",
  //     type,
  //     title,
  //     message,
  //     onConfirm: null,
  //   });
  // };

  // const confirm = (title, message, onConfirm, type = "warning") => {
  //   setAlert({
  //     isOpen: true,
  //     mode: "confirm",
  //     type,
  //     title,
  //     message,
  //     onConfirm,
  //   });
  // };

  const open = (options) => setAlert({ ...defaults, isOpen: true, ...options });

  const close = () =>
    setAlert((prev) => ({
      ...prev,
      isOpen: false,
    }));

  // const handleConfirm = () => {
  //   if (alert.onConfirm) {
  //     alert.onConfirm();
  //   }
  //   close();
  // };
  const handleConfirm = (value) => {
    alert.onConfirm?.(value);
    close();
  };
  const prompt = (title, message, onConfirm, type = "info", value = "") => {
    setAlert({
      isOpen: true,
      mode: "prompt",
      type,
      title,
      message,
      value,
      onConfirm,
    });
  };
  return (
    <AlertContext.Provider
      value={{
        show: (type, title, message) =>
          open({ mode: "alert", type, title, message }),

        confirm: (title, message, onConfirm, type = "warning") =>
          open({ mode: "confirm", type, title, message, onConfirm }),
        prompt: (title, message, onConfirm, type = "info", value = "") =>
          open({
            mode: "prompt",
            type,
            title,
            message,
            value,
            onConfirm,
          }),

        success: (msg, title = "Thành công") =>
          open({ type: "success", title, message: msg }),

        error: (msg, title = "Lỗi") =>
          open({ type: "error", title, message: msg }),

        warning: (msg, title = "Cảnh báo") =>
          open({ type: "warning", title, message: msg }),

        info: (msg, title = "Thông báo") =>
          open({ type: "info", title, message: msg }),
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
