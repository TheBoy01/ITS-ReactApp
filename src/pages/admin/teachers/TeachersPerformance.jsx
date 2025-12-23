import React, { useState } from "react";
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

// Sample teacher data
const teachersData = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    subject: "Mathematics",
    department: "Science",
    grade: "9-12",
    studentsCount: 120,
    rating: 4.8,
    attendance: 98,
    classesCompleted: 145,
    totalClasses: 150,
    status: "Active",
    joinDate: "2020-08-15",
    image: "SJ",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@school.edu",
    subject: "Physics",
    department: "Science",
    grade: "10-12",
    studentsCount: 95,
    rating: 4.9,
    attendance: 100,
    classesCompleted: 148,
    totalClasses: 150,
    status: "Active",
    joinDate: "2019-09-01",
    image: "MC",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@school.edu",
    subject: "English Literature",
    department: "Arts",
    grade: "9-11",
    studentsCount: 110,
    rating: 4.7,
    attendance: 96,
    classesCompleted: 142,
    totalClasses: 150,
    status: "Active",
    joinDate: "2021-01-10",
    image: "ER",
  },
  {
    id: 4,
    name: "David Thompson",
    email: "david.thompson@school.edu",
    subject: "History",
    department: "Social Studies",
    grade: "8-10",
    studentsCount: 105,
    rating: 4.6,
    attendance: 94,
    classesCompleted: 140,
    totalClasses: 150,
    status: "Active",
    joinDate: "2018-08-20",
    image: "DT",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    email: "lisa.anderson@school.edu",
    subject: "Chemistry",
    department: "Science",
    grade: "10-12",
    studentsCount: 88,
    rating: 4.9,
    attendance: 99,
    classesCompleted: 149,
    totalClasses: 150,
    status: "Active",
    joinDate: "2020-02-15",
    image: "LA",
  },
  {
    id: 6,
    name: "Robert Martinez",
    email: "robert.martinez@school.edu",
    subject: "Physical Education",
    department: "Physical Education",
    grade: "6-12",
    studentsCount: 200,
    rating: 4.5,
    attendance: 92,
    classesCompleted: 138,
    totalClasses: 150,
    status: "On Leave",
    joinDate: "2017-09-01",
    image: "RM",
  },
  {
    id: 7,
    name: "Jennifer Lee",
    email: "jennifer.lee@school.edu",
    subject: "Art",
    department: "Arts",
    grade: "6-9",
    studentsCount: 130,
    rating: 4.8,
    attendance: 97,
    classesCompleted: 146,
    totalClasses: 150,
    status: "Active",
    joinDate: "2019-01-15",
    image: "JL",
  },
  {
    id: 8,
    name: "William Brown",
    email: "william.brown@school.edu",
    subject: "Computer Science",
    department: "Technology",
    grade: "9-12",
    studentsCount: 115,
    rating: 4.9,
    attendance: 98,
    classesCompleted: 147,
    totalClasses: 150,
    status: "Active",
    joinDate: "2020-08-01",
    image: "WB",
  },
];

const TeachersPerformance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const { TeacherPerformanceData, loading } = useReferenceData();

  // Get unique departments and grades
  const departments = [
    "All",
    ...new Set(teachersData.map((t) => t.department)),
  ];
  const grades = ["All", ...new Set(teachersData.map((t) => t.grade))];
  const statuses = ["All", "Active", "On Leave"];

  // Filter teachers
  const filteredTeachers = teachersData.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All" || teacher.department === selectedDepartment;
    const matchesGrade =
      selectedGrade === "All" || teacher.grade === selectedGrade;
    const matchesStatus =
      selectedStatus === "All" || teacher.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesGrade && matchesStatus;
  });

  const { teacherPerformanceInfoList = [], tblObsCommentsList = [] } =
    TeacherPerformanceData;
  // Calculate stats
  const totalTeachers = teacherPerformanceInfoList.length;
  const avgRating = (
    teacherPerformanceInfoList.reduce((sum, t) => sum + t.averageRating, 0) /
    totalTeachers
  ).toFixed(1);
  const avgAttendance = Math.round(
    teacherPerformanceInfoList.reduce((sum, t) => sum + t.attendance, 0) /
      totalTeachers
  );
  const totalStudents = filteredTeachers.reduce(
    (sum, t) => sum + t.studentsCount,
    0
  );

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1 text-yellow-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= Math.round(rating)} />
        ))}
      </div>
    );
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
                <p className="text-3xl font-bold text-slate-800">{avgRating}</p>
                {renderStars(parseFloat(avgRating))}
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
      <div className="p-4 mb-6 bg-white border rounded-lg shadow border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute transform -translate-y-1/2 left-3 top-1/2 text-slate-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 transition-colors rounded-lg bg-slate-100 hover:bg-slate-200"
          >
            <FilterIcon />
            <span className="font-medium">Filters</span>
            <ChevronDownIcon />
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <DownloadIcon />
            <span className="font-medium">Export</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t md:grid-cols-3 border-slate-200">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {teacherPerformanceInfoList.map((teacher) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    {selectedTeacher.name}
                  </h4>
                  <p className="text-slate-600">{selectedTeacher.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(selectedTeacher.rating)}
                    <span className="text-sm text-slate-600">
                      ({selectedTeacher.rating})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-1 text-sm text-slate-600">Subject</p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.subject}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Department</p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.department}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Grade Level</p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.grade}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Students</p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.studentsCount}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Attendance Rate</p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.attendance}%
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">
                    Classes Progress
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.classesCompleted}/
                    {selectedTeacher.totalClasses}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTeacher.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {selectedTeacher.status}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600">Join Date</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(selectedTeacher.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
                <button className="flex-1 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                  View Full Profile
                </button>
                <button className="flex-1 px-4 py-2 transition-colors rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPerformance;
