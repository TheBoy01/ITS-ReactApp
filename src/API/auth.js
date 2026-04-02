import api from "./api"; // <-- your axios instance

// API/auth.js — make sure you return the full object
export const verifyUser = async (IdNo, EmailID) => {
  try {
    const response = await api.get("/api/Ticket/GetEmployeeByIDNo", {
        params: { IDNo: IdNo, EmailID }
    });

    return response.data; // should contain { token, ...employeeInfo }
  } catch (error) {
    throw error.response?.data || error;
  }
};
