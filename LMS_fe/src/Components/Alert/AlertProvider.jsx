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
  const prompt = (
    message,
    title = "Nhập thông tin",
    type = "info",
    defaultValue = "",
  ) => {
    return new Promise((resolve) => {
      open({
        mode: "prompt",
        type,
        title,
        message,
        value: defaultValue,
        onConfirm: resolve,
      });
    });
  };
  // const confirm = (
  //   message,
  //   title = "Xác nhận",
  //   type = "warning",
  //   onConfirmCallback = null,
  // ) => {
  //   return new Promise((resolve) => {
  //     open({
  //       mode: "confirm",
  //       type,
  //       title,
  //       message,
  //       onConfirm: (val) => {
  //         onConfirmCallback?.(val);
  //         resolve(true);
  //       },
  //     });
  //   });
  // };
  return (
    <AlertContext.Provider
      value={{
        showAlert: (type, title, message) =>
          open({ mode: "alert", type, title, message }),

        confirm: (title, message, onConfirm, type = "warning") =>
          open({ mode: "confirm", type, title, message, onConfirm }),
        prompt,

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
