import API from "./api";

export const getStudentByStudentIDNo = async (studentIDNo) => {
  try {
    const response = await API.get("/api/Clinic/GetStudentRecordByStudentNo", {
      params: { studentIDNo },
    });

    return response.data;
  } catch (error) {
    return null; // Return null if not found or on error
  }
};

export const createRecordValidation = async (ClinicRecordDTO) => {
  const response = await API.post(
    "/api/Clinic/CreateRecordValidation",
    ClinicRecordDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data; // Returns { isSuccessful: boolean, status: string }
};

export const createRecordAsync = async (ClinicRecordDTO) => {
  const response = await API.post(
    "/api/Clinic/createRecordAsync",
    ClinicRecordDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};
