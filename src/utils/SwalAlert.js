import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize ToastContainer in your App.jsx or main layout once:
// import { ToastContainer } from "react-toastify";
// <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

// ---------- ALERT MODALS ----------
export const SwalSuccess = (title, message) => {
  Swal.fire({
    icon: "success",
    title: title || "Success",
    text: message || "",
    confirmButtonColor: "#3085d6",
  });
};

export const SwalError = (title, message) => {
  Swal.fire({
    icon: "error",
    title: title || "Error",
    text: message || "",
    confirmButtonColor: "#d33",
  });
};

export const SwalWarning = (title, message) => {
  Swal.fire({
    icon: "warning",
    title: title || "Warning",
    text: message || "",
    confirmButtonColor: "#f1c40f",
  });
};

export const SwalInfoDynamic = ({
  title = "Information",
  html,
  width = "600px",
}) => {
  return Swal.fire({
    icon: "info",
    title,
    html, // 🔥 Custom HTML goes here
    width,
    showConfirmButton: true,
    confirmButtonText: "Close",
    confirmButtonColor: "#3085d6",
  });
};

// ---------- TOAST NOTIFICATIONS USING REACT-TOASTIFY ----------
export const ToastSuccess = (message) => {
  toast.success(message || "Success!", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    pauseOnHover: true,
    draggable: true,
    newestOnTop: true,
  });
};

export const ToastError = (message) => {
  toast.error(message || "Error!", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    pauseOnHover: true,
    draggable: true,
    newestOnTop: true,
  });
};

export const ToastInfo = (message) => {
  toast.info(message || "Info", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    pauseOnHover: true,
    draggable: true,
    newestOnTop: true,
  });
};

export const ToastWarning = (message) => {
  toast.warning(message || "Warning", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    pauseOnHover: true,
    draggable: true,
    newestOnTop: true,
  });
};

// ---------- YES / NO CONFIRM ----------
export const SwalConfirm = async (title, message) => {
  const result = await Swal.fire({
    title: title || "Confirm",
    text: message || "",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
  });

  return result.isConfirmed;
};
