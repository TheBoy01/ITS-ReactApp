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
  const { token } = useAuth();
  const [TeacherPerformanceData, setTeacherPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const [TPODataList] = await Promise.all([
          api.get("api/TeacherPerformance/GetDashboardRefData"),
        ]);

        setTeacherPerformanceData(TPODataList.data);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, [token]);

  const value = useMemo(
    () => ({ TeacherPerformanceData, loading }),
    [TeacherPerformanceData, loading]
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
      "useReferenceData must be used within DashboardDataContextProvider"
    );
  }
  return context;
};
