import API from "./api";
import * as signalR from "@microsoft/signalr";

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

export const getClinicRecordListByClinicDept = async () => {
  try {
    const response = await API.get(
      "/api/Clinic/GetClinicRecordListByClinicDept",
    );
    return response.data;
  } catch (error) {
    //  console.error("Error fetching ticket list:", error);
    throw error;
  }
};

export const createNewRecordConnection = () => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API.defaults.baseURL}/clinicHub`, {
      // ✅ Allow multiple transport types as fallback
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        if (retryContext.previousRetryCount === 0) return 0;
        if (retryContext.previousRetryCount === 1) return 2000;
        if (retryContext.previousRetryCount === 2) return 10000;
        if (retryContext.previousRetryCount === 3) return 30000;
        return null;
      },
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const getRecordAttachments = async (recordNo, studentNo) => {
  try {
    const response = await API.get(
      `/api/Clinic/GetStudentClinicRecordAttachmentsAsync`,
      {
        params: {
          recordNo: recordNo,
          studentNo: studentNo,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return [];
  }
};

export const updateClinicRecordAsync = async (ClinicRecordDTO) => {
  const response = await API.put(
    "/api/Clinic/UpdateClinicRecordAsync",
    ClinicRecordDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};
