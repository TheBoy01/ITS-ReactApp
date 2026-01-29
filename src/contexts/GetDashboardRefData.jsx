import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import api from "../API/api";

const GetDashboardRefData = createContext();

export const DashboardDataContext = ({ children }) => {
  const { loading: authLoading } = useAuth(); // only care about auth init
  const [TeacherPerformanceData, setTeacherPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          "api/TeacherPerformance/GetDashboardRefData",
        );
        //console.log("Fetched reference data:", response.data);
        setTeacherPerformanceData(response.data);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchReferenceData();
    }
  }, [authLoading]);

  const value = useMemo(
    () => ({ TeacherPerformanceData, loading }),
    [TeacherPerformanceData, loading],
  );

  return (
    <GetDashboardRefData.Provider value={value}>
      {children}
    </GetDashboardRefData.Provider>
  );
};

export const useReferenceData = () => {
  const context = useContext(GetDashboardRefData);
  if (!context) {
    throw new Error(
      "useReferenceData must be used within DashboardDataContext",
    );
  }
  return context;
};

export const GetTeacherAttainmentByTeacherID = async (
  TeachersAttaintmentRatingDto,
) => {
  try {
    //console.log(TeachersAttaintmentRatingDto);
    const response = await api.get(
      "/api/TeacherPerformance/GetTeacherAttainment/",
      {
        params: {
          teacherID: TeachersAttaintmentRatingDto.TeacherID,
        },
      },
    );
    console.log("Fetched student performance:", response.data);
    return response.data; //setStudentPerfData(response.data);
  } catch (error) {
    console.error("Failed to fetch student performance:", error);
  }
};
