import API from "./api";

export const getTeachersPerformanceInfoList = async (teacherPerformanceDTO) => {
  console.log(teacherPerformanceDTO);
  const response = await API.get(
    "/api/TeacherPerformance/GetTeachersPerformanceInfoList",
    {
      params: {
        acadYear: teacherPerformanceDTO.acadYear,
        acadTerm: teacherPerformanceDTO.acadTerm,
        // ← do NOT include empIDS here
      },
    }
  );
  return response.data;
};

export const generateTPOReportAsync = async (dto) => {
  const response = await API.post(
    "/api/TeacherPerformance/GenerateTPOReportAsync",
    dto,                          // ← JSON body
    { responseType: "blob" }      // ← tells Axios to return binary
  );
  return response.data;           // ← already a Blob with responseType: "blob"
};

export const createTeacherObsFormValidation = async (LessonObservationFormDTO) => {
  const response = await API.post(
    "/api/TeacherPerformance/CreateTeacherObsFormValidation",
    LessonObservationFormDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  ); 
  return response.data; // Returns { isSuccessful: boolean, status: string }
};

export const CreateTeacherObsFormAsync = async (LessonObservationFormDTO) => {
  const response = await API.post(
    "/api/TeacherPerformance/CreateTeacherObsFormAsync",
    LessonObservationFormDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};

export const createLessonSurveyFormValidation = async (TeacherSurveyFormDTO) => {
  const response = await API.post(
    "/api/TeacherPerformance/CreateTeacherSurveyFormValidation",
    TeacherSurveyFormDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  ); 
  return response.data; // Returns { isSuccessful: boolean, status: string }
};

export const createLessonSurveyFormAsync = async (TeacherSurveyFormDTO) => {
  const response = await API.post(
    "/api/TeacherPerformance/CreateTeacherSurveyFormAsync",
    TeacherSurveyFormDTO,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ← add this!
      },
    },
  );
  return response.data;
};

export const getTeacherFilledFormListAsync = async () => {
  try {
    const response = await API.get("/api/TeacherPerformance/GetTeacherFilledFormListAsync");
    return response.data;
  } catch (error) {
    //  console.error("Error fetching ticket list:", error);
    throw error;
  }
};

export const createNewRecordConnection = () => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API.defaults.baseURL}/teachersformHub`, {
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

export const getObservationDetailsByID = async (Idx, formType) => {
  try { 
    const response = await API.get("/api/TeacherPerformance/GetObservationDetailsByID", {
      params: { Idx, formType },
    });
 
    return response.data;
  } catch (error) {
    return null; // Return null if not found or on error
  }
};