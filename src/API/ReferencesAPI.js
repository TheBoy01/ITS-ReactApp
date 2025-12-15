import api from "./api"; // your axios instance

// Get all reference lists (Support Category, Marking, etc.)
export const getReferenceLists = async () => {
  try {
    const response = await api.get("api/Ticket/GetTicketingReferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
};
