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

export const getClinicReferences = async () => {
  try {
    const response = await api.get("api/Clinic/GetClinicReferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
};
