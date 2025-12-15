import api from "./api"; // <-- your axios instance

export const verifyUser = async (IDNo, EmailID) => {
  try {
    const response = await api.get("/api/Ticket/GetEmployeeByIDNo", {
      params: { IDNo, EmailID },
    });

    return response.data; // should contain { token, ...employeeInfo }
  } catch (error) {
    throw error.response?.data || error;
  }
};
