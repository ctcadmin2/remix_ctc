import { showNotification } from "@mantine/notifications";
import type { ToastMessage } from "remix-toast";

const color = {
  info: "blue",
  success: "teal",
  error: "red",
  warning: "yellow",
};

const title = {
  info: "",
  success: "Success",
  error: "There has been an error.",
  warning: "Warning!",
};

const handleNotification = (toast: ToastMessage) => {
  showNotification({
    message: toast.message,
    withCloseButton: true,
    withBorder: true,
    color: color[toast.type],
    title: title[toast.type],
    // autoClose: false,
  });
};

export default handleNotification;
