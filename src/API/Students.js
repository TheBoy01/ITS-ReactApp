import api from "./api"; // <-- your axios instance

export const createLateStudentValidation = async ({ studentNo }) => {
  try {
    const formData = new FormData();
    formData.append("StudentNo", studentNo);

    // Debug - remove after fixing
    console.log("Sending StudentNo:", studentNo, "Type:", typeof studentNo);
    for (let [key, value] of formData.entries()) { 
    }

    const response = await api.post("api/Students/CreateLateStudentValidation", formData);
    return response.data;
  } catch (error) { 
    throw error.response?.data || error;
  }
};
export const createLateStudent = async ({ studentNo, remarks }) => {
  try {
    const formData = new FormData();
    formData.append("StudentNo", studentNo);
    if (remarks) formData.append("Remarks", remarks);

    const response = await api.post("api/Students/CreateLateStudent", formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const searchLateStudentsList = async (searchLateStudentsDTO) => {
  try {
    const response = await api.post("/api/Students/SearchLateStudentsList", {
      studentNo: searchLateStudentsDTO.studentNo || null,
      acadYear: searchLateStudentsDTO.academicYear || null,
      term: searchLateStudentsDTO.term || null,
      fromDate: searchLateStudentsDTO.dateFrom || null,
      toDate: searchLateStudentsDTO.dateTo || null,
      studentName: searchLateStudentsDTO.studentName || null,
    });
    return response.data;
  } catch (error) {
    console.log("Search error:", error.response?.data);
    throw error;
  }
};

export const getLateStudentsReferences = async () => {
  try { 
    const response = await api.get("api/Students/GetLateStudentsReferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
}; 

export const getStudentList = async () => {
  try { 
    const response = await api.get("api/Students/GetStudentList");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
};

export const getStudentsPhotoByStudentIDNo = async (studentIDNos) => {
  try {
    const response = await api.post("api/Students/GetPhotoUrlListByStudentIDNo", studentIDNos);
    return response.data;
  } catch (error) {
    console.error("Error fetching student photos:", error);
    throw error.response?.data || error;
  }
};