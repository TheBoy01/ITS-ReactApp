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

export const getTicketListByUserID = async (userIDNo) => {
  try {
    const response = await api.get("/api/Ticket/GetCreatedTicketList", {
      params: { userIDNo }, // <-- send as query parameter
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching ticket list:", error);
    throw error.response?.data || error;
  }
};
