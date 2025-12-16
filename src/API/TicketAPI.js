// API/TicketAPI.js
import api from "./api";

export async function createTicket(payload) {
  try {
    const response = await api.post("api/Ticket/CreateTicket", payload);
    return response.data; // Always TicketResponseDTO
  } catch (err) {
    console.error("Error creating ticket:", err.response.data);
    if (err.response && err.response.data) {
      return err.response.data; // Return the TicketResponseDTO with isSuccessful=false
    }
    return {
      isSuccessful: false,
      status: "Unexpected error occurred.",
    };
  }
}

export const getTicketListByUserID = async () => {
  try {
    const response = await api.get("/api/Ticket/GetCreatedTicketList");

    return response.data;
  } catch (error) {
    console.error("Error fetching ticket list:", error);
    throw error.response?.data || error;
  }
};

export const getTicketNotificationListByUser = async () => {
  try {
    const response = await api.get("/api/Ticket/GetNotificationListByUser");

    return response.data.filter((a) => a.moduleCode === "TKT");
  } catch (error) {
    console.error("Error fetching ticket list:", error);
    throw error.response?.data || error;
  }
};

/* 🔔 MARK NOTIFICATION AS READ */
//=>> UPDATE AS READ PER NOTIF
//export const markNotificationAsRead = async (notificationID) => {
//await api.put(`/Ticket/notifications/${notificationID}/read`);
export const markNotificationAsRead = async () => {
  try {
    alert("Update notif");
    await api.put(`/api/Ticket/MarkAllAsRead`);
  } catch (error) {
    console.log(error);
  }
};
