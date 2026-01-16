import React, { useState, useEffect } from "react";
import { useReferenceData } from "../../../contexts/GetDashboardRefData";
import SkeletonLargeBoxes from "../../../components/skeletons/SkeletonLargeBoxes";
// Icons
const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg
    className="w-4 h-4"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

//Icons End

const TeachersPerformance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const { TeacherPerformanceData, loading } = useReferenceData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState(false);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const {
    teacherPerformanceInfoList = [],
    tblPerformanceOverviewList = [],
    RefTermScheduleList = [],
    refRatingList = [],
  } = TeacherPerformanceData;

  const distinctByTerm = Array.from(
    new Map(
      teacherPerformanceInfoList.map((item) => [item.term, item])
    ).values()
  );
  const distinctByAcadYear = Array.from(
    new Map(
      teacherPerformanceInfoList.map((item) => [item.schoolYear, item])
    ).values()
  );
  // Get unique departments
  const departments = [
    "All",
    ...Array.from(
      new Map(
        teacherPerformanceInfoList.map((t) => {
          const dep = t.department?.trim() ?? ""; // if null/undefined → ""
          return [dep.toLowerCase(), dep]; // key for distinct, value to keep
        })
      ).values()
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const subjects = [
    "All",
    ...new Set(teacherPerformanceInfoList.map((t) => t.subject)),
  ];
  const statuses = [
    "All",
    ...new Set(teacherPerformanceInfoList.map((t) => t.status)),
  ];
  const terms = ["All", ...new Set(distinctByTerm.map((item) => item.term))];
  const acadYears = [
    "All",
    ...new Set(distinctByAcadYear.map((item) => item.schoolYear)),
  ];

  // Filter teachers
  const filteredTeachers = teacherPerformanceInfoList.filter((teacher) => {
    const matchesSearch =
      teacher.empID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All" || teacher.department === selectedDepartment;
    const matchesSubject =
      selectedSubject === "All" || teacher.subject === selectedSubject;
    const matchesStatus =
      selectedStatus === "All" || teacher.status === selectedStatus;
    const matchesTerm =
      selectedTerm === "All" || teacher.term.toString() === selectedTerm;
    const matchesAcadYear =
      selectedAcademicYear === "All" ||
      teacher.schoolYear.toString() === selectedAcademicYear;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesSubject &&
      matchesStatus &&
      matchesTerm &&
      matchesAcadYear
    );
  });

  // Calculate stats
  const totalTeachers = filteredTeachers.length;
  const avgRating = (
    filteredTeachers.reduce((sum, t) => sum + t.averageRating, 0) /
    totalTeachers
  ).toFixed(1);
  const avgAttendance = Math.round(
    filteredTeachers.reduce((sum, t) => sum + t.attendance, 0) / totalTeachers
  );
  const totalStudents = filteredTeachers.reduce(
    (sum, t) => sum + t.studentsCount,
    0
  );

  const getRatingName = (averageRating, referenceData) => {
    if (!referenceData?.length) return "N/A";

    const matchedRating = referenceData
      .filter((r) => r.ratingValue <= averageRating)
      .sort((a, b) => b.ratingValue - a.ratingValue)[0];

    return matchedRating?.ratingName ?? "N/A";
  };

  const ratingName = getRatingName(avgRating, refRatingList);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1 text-yellow-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= Math.round(rating)} />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
    };
    return date.toLocaleDateString("en-US", options);
  };

  // Function to determine current term based on current month
  const getCurrentTerm = () => {
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    for (let term of RefTermScheduleList) {
      if (term.StartMonth <= term.EndMonth) {
        // Normal range (e.g., Term 2: Jan-Mar, Term 3: Apr-Aug)
        if (currentMonth >= term.StartMonth && currentMonth <= term.EndMonth) {
          return term.TermSched;
        }
      } else {
        // Wrapping range (e.g., Term 1: Sep-Dec spans year end)
        if (currentMonth >= term.StartMonth || currentMonth <= term.EndMonth) {
          return term.TermSched;
        }
      }
    }
    return 1; // Default to term 1 if not found
  };

  // Function to get current academic year
  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // If current month is September or later, academic year starts this year
    // Otherwise, it started last year
    return currentMonth >= 9 ? currentYear : currentYear - 1;
  };

  // Auto-detect current term and academic year on mount
  useEffect(() => {
    const currentTerm = getCurrentTerm();
    const currentAcademicYear = getCurrentAcademicYear();

    setSelectedTerm(currentTerm.toString());
    setSelectedAcademicYear(currentAcademicYear.toString());
  }, []);

  // Format academic year for display (e.g., "2024-2025")
  const formatAcademicYear = (year) => {
    // Handle "ALL" or non-numeric values
    if (year === "ALL" || isNaN(parseInt(year))) {
      return year;
    }
    return `${year}-${parseInt(year) + 1}`;
  };

  if (loading) return <SkeletonLargeBoxes />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Teachers Performance
        </h2>
        <p className="mt-1 text-slate-600">
          Monitor and evaluate teacher performance metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-slate-600">Total Teachers</p>
              <p className="text-3xl font-bold text-slate-800">
                {totalTeachers}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-slate-600">Avg Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-slate-800">
                  {" "}
                  {ratingName}
                </p>
                {/**  {renderStars(parseFloat(avgRating))}*/}
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <StarIcon filled={true} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-slate-600">Avg Attendance</p>
              <p className="text-3xl font-bold text-slate-800">
                {avgAttendance}%
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        {/*}
        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-slate-600">Total Students</p>
              <p className="text-3xl font-bold text-slate-800">
                {totalStudents}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      */}
      </div>

      {/* Filters and Search */}

      <div className="p-4 mb-6 space-y-4 bg-white border rounded-lg shadow border-slate-200">
        {/* TOP ROW */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Term & Academic Year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-2/3">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                {acadYears.map((year) => (
                  <option key={year} value={year}>
                    {formatAcademicYear(year)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 lg:ml-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              <FilterIcon />
              <span className="font-medium">More Filters</span>
              <ChevronDownIcon />
            </button>
            {/*
            <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <DownloadIcon />
              <span className="font-medium">Export</span>
            </button>* */}
          </div>
        </div>

        {/* SEARCH ROW */}
        <div>
          <div className="relative">
            <div className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* EXPANDED FILTERS */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 border-t md:grid-cols-3 border-slate-200">
            {/* Department */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Teachers Table */}
      <div className="overflow-hidden bg-white border rounded-lg shadow border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-slate-50 border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-left text-slate-700">
                  Teacher
                </th>
                <th className="px-4 py-3 font-semibold text-left text-slate-700">
                  Subject
                </th>
                <th className="px-4 py-3 font-semibold text-left text-slate-700">
                  Department
                </th>
                <th className="px-4 py-3 font-semibold text-center text-slate-700">
                  Rating
                </th>
                <th className="px-4 py-3 font-semibold text-center text-slate-700">
                  Attendance
                </th>
                <th className="px-4 py-3 font-semibold text-center text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-center text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => {
                //  const progressPercentage = Math.round(
                // (teacher.classesCompleted / teacher.totalClasses) * 100
                //  );
                return (
                  <tr
                    key={teacher.empID}
                    className="transition-colors border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 font-semibold text-white bg-blue-600 rounded-full">
                          {teacher.empName
                            ?.trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((name) => name[0].toUpperCase())
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {teacher.empName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {teacher.position}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {teacher.subject}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {teacher.department}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-slate-800">
                          {teacher.rating}
                        </span>
                        {renderStars(teacher.averageRating)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold ${
                          teacher.attendance >= 95
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {teacher.attendance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          teacher.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedTeacher(teacher)}
                        className="flex items-center justify-center p-2 mx-auto transition-colors rounded-lg hover:bg-slate-100"
                        title="View Details"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-slate-500">
              No teachers found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-100">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">
                    Teacher Details
                  </h3>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="p-2 transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-200">
                  <div className="flex items-center justify-center w-20 h-20 text-2xl font-semibold text-white bg-blue-600 rounded-full">
                    {selectedTeacher.image}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-slate-800">
                      {selectedTeacher.empName}
                    </h4>
                    <p className="text-slate-600">{selectedTeacher.position}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(selectedTeacher.averageRating)}
                      <span className="text-sm text-slate-600">
                        (Overall Rating)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Joined Date - Always Visible */}
                <div className="pb-4 mb-6">
                  <div className="mb-4">
                    <p className="mb-1 text-sm text-slate-600">Joined Date</p>
                    <p className="font-semibold text-slate-800">
                      {formatDate(selectedTeacher.joinedDate)}
                    </p>
                  </div>

                  {/* Performance Comments Section */}
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={() =>
                        setIsPerformanceExpanded(!isPerformanceExpanded)
                      }
                      className="flex items-center justify-between w-full p-3 transition-colors rounded-lg hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-800">
                        Performance Comments
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${
                          isPerformanceExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isPerformanceExpanded
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {selectedTeacher.performanceManager ? (
                        <div className="pt-4 space-y-4">
                          <div>
                            <p className="mb-1 text-sm text-slate-600">
                              Performance Manager
                            </p>
                            <p className="font-semibold text-slate-800">
                              {selectedTeacher.performanceManager}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="mb-1 text-sm text-slate-600">
                                Teaching Quality
                              </p>
                              <p className="font-semibold text-slate-800">
                                {selectedTeacher.teachingQuality}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm text-slate-600">
                                Response to Students
                              </p>
                              <p className="font-semibold text-slate-800">
                                {selectedTeacher.responseToStudents}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-sm text-slate-600">
                                Contributed to School
                              </p>
                              <p className="font-semibold text-slate-800">
                                {selectedTeacher.contribToSchool}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-500">
                          No Data Found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Overview Section with Dropdown */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full p-3 transition-colors rounded-lg hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-800">
                      Performance Overview
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "max-h-[600px] opacity-100 overflow-y-auto"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    <div className="pt-4">
                      {(() => {
                        const filteredData =
                          tblPerformanceOverviewList?.filter(
                            (a) =>
                              a.observation?.teacherIdNo ===
                              selectedTeacher?.empID
                          ) || [];
                        // console.log("Filtered Data:", filteredData);
                        return filteredData.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Class
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Subject
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Topic
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Observer Name
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Performance Rating
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Clear Progress Demo
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Demand Placed
                                  </th>
                                  <th className="px-4 py-3 text-sm font-semibold text-left border-b text-slate-700 border-slate-200">
                                    Effective Plenary
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredData.map((row, index) => (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm border-b text-slate-800 border-slate-200">
                                      {row.observation.class || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm border-b text-slate-800 border-slate-200">
                                      {row.observation.subject || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm border-b text-slate-800 border-slate-200">
                                      {row.observation.topic || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm border-b text-slate-800 border-slate-200">
                                      {row.observation.observerName || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm border-b text-slate-800 border-slate-200">
                                      {renderStars(
                                        row.overallRatingValue || "-"
                                      )}{" "}
                                      <span>
                                        ({row.observation?.overallRating})
                                      </span>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-sm border-b text-slate-700 border-slate-200">
                                      {renderStars(
                                        row.clearProgressRatingValue || "-"
                                      )}
                                      <span>
                                        ({row.observation?.clearProgressDemo})
                                      </span>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-sm border-b text-slate-700 border-slate-200">
                                      {renderStars(
                                        row.demandPlacedRatingValue || "-"
                                      )}
                                      <span>
                                        ({row.observation?.demandPlaced})
                                      </span>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-sm border-b text-slate-700 border-slate-200">
                                      {renderStars(
                                        row.effectivePlenaryRatingValue || "-"
                                      )}
                                      <span>
                                        ({row.observation?.effectivePlenary})
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-500">
                            No Data Found
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPerformance;
