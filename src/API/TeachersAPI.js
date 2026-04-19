  //getTeachersList,
  //createTeacherValidation,
  //createTeacher,
  //updateTeacherValidation,
  //updateTeacher,
  //getTeachersReferences,

import api from "./api"; // <-- your axios instance
 
export const createTeachersValidationAsync = async (TeachersDTO) => {
  const response = await API.post(
    "/api/Teachers/CreateTeachersValidation",
    TeachersDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data; // Returns { isSuccessful: boolean, status: string }
};
 
export const createTeachersAsync = async (TeachersDTO) => {
  const response = await API.post(
    "/api/Teachers/CreateTeachersAsync",
    TeachersDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};

export const updateTeachersValidationAsync = async (TeachersDTO) => {
  const response = await API.post(
    "/api/Teachers/UpdateTeacherValidation",
    TeachersDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data; // Returns { isSuccessful: boolean, status: string }
};

export const updateTeachersRecordAsync = async (TeachersDTO) => {
  const response = await API.put(
    "/api/Teachers/UpdateClinicRecordAsync",
    TeachersDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};

export const getTeachersListAsync = async () => {
  try { 
    const response = await api.get("api/Teachers/GetTeachersList");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
}; 

export const getTeachersReferences = async () => {
  try { 
    const response = await api.get("api/Teachers/GetTeachersReferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference lists:", error);
    throw error.response?.data || error;
  }
}; 