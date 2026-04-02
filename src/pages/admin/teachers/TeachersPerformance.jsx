import React, { useState, useEffect, useRef } from "react";
import {
  useReferenceData,
  GetTeacherAttainmentByTeacherID,
} from "../../../contexts/GetDashboardRefData";
import {
  getTeachersPerformanceInfoList,
  generateTPOReportAsync,
} from "../../../API/TeacherPerformanceAPI";
import SkeletonLargeBoxes from "../../../components/skeletons/SkeletonLargeBoxes";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const REPORT_TYPES = [
  { id: "teacher-performance", label: "1. Teacher Performance" },
];

const GRADE_KEYS = [
  "a1",
  "a2",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "u1",
  "zero",
];
const GRADE_HEADERS = [
  "A1",
  "A2",
  "B1",
  "C1",
  "D1",
  "E1",
  "F1",
  "G1",
  "U1",
  "Zero",
];

const OVERVIEW_HEADERS = [
  "Class",
  "Subject",
  "Topic",
  "Observer Name",
  "Performance Rating",
  "Clear Progress Demo",
  "Demand Placed",
  "Effective Plenary",
];

const ATTAINMENT_HEADERS = [
  "Course Name",
  ...GRADE_HEADERS,
  "Above Expected",
  "Expected",
  "Below Expected",
];

const TABLE_HEADERS = [
  "Teacher",
  "Subject",
  "Department",
  "Rating",
  "Attendance",
  "Status",
  "Actions",
];

const FILTER_FIELDS = [
  { label: "Academic Year", key: "academicYear" },
  { label: "Term", key: "term" },
  { label: "Department", key: "department" },
  { label: "Subject", key: "subject" },
  { label: "Status", key: "status" },
];

const INITIAL_FILTERS = {
  searchTerm: "",
  department: "All",
  subject: "All",
  status: "All",
  term: "All",
  academicYear: "All",
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Icon = ({ name, className = "" }) => (
  <i className={`fa-solid fa-${name} ${className}`} />
);
const ChevronDown = () => <Icon name="chevron-down" className="text-[10px]" />;
const ChevronUp = () => <Icon name="chevron-up" className="text-[10px]" />;
const ChevronLeft = () => <Icon name="chevron-left" className="text-[10px]" />;
const ChevronRight = () => (
  <Icon name="chevron-right" className="text-[10px]" />
);
const AnglesLeft = () => <Icon name="angles-left" className="text-[10px]" />;
const AnglesRight = () => <Icon name="angles-right" className="text-[10px]" />;
const StarIcon = ({ filled }) => (
  <i className={`${filled ? "fa-solid" : "fa-regular"} fa-star text-sm`} />
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const renderStars = (rating) => (
  <div className="flex items-center gap-0.5 text-yellow-500">
    {[1, 2, 3, 4, 5].map((s) => (
      <StarIcon key={s} filled={s <= Math.round(rating)} />
    ))}
  </div>
);

const getRatingName = (averageRating, referenceData) => {
  if (!referenceData?.length) return "N/A";
  const matched = referenceData
    .filter((r) => r.ratingValue <= averageRating)
    .sort((a, b) => b.ratingValue - a.ratingValue)[0];
  return matched?.ratingName ?? "N/A";
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

const formatAcademicYear = (year) => {
  if (year === "All" || isNaN(parseInt(year))) return year;
  return `${year}-${parseInt(year) + 1}`;
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────
const Avatar = ({ name, size = "sm" }) => {
  const sizes = { sm: "w-10 h-10 text-sm", lg: "w-20 h-20 text-2xl" };
  return (
    <div
      className={`flex items-center justify-center font-semibold text-white bg-blue-600 rounded-full shrink-0 ${sizes[size]}`}
    >
      {getInitials(name)}
    </div>
  );
};

const Badge = ({ active }) => (
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${active ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const EmptyState = ({ icon, message }) => (
  <p className="py-6 text-center text-slate-500">
    {icon && <i className={`fa-solid fa-${icon} mr-2`} />}
    {message}
  </p>
);

const SelectField = ({ label, value, onChange, options, required = false }) => (
  <div>
    {label && (
      <label className="block mb-1.5 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  </div>
);

// ─────────────────────────────────────────────
// COLLAPSIBLE SECTION
// ─────────────────────────────────────────────
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-1 py-3 transition-colors rounded-lg hover:bg-slate-50"
      >
        <span className="font-semibold text-slate-800">{title}</span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, value, bg, icon }) => (
  <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm text-slate-600">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-lg ${bg}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// GENERATE REPORT BUTTON (DROPDOWN)
// ─────────────────────────────────────────────
const GenerateReportButton = ({ onGenerate, selectedCount, generating }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={selectedCount === 0 || generating}
        className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <i className="fa-solid fa-spinner fa-spin" />
        ) : (
          <i className="fa-solid fa-file-lines" />
        )}
        <span>{generating ? "Generating…" : "Generate Report"}</span>
        {selectedCount > 0 && !generating && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-emerald-700 rounded-full">
            {selectedCount}
          </span>
        )}
        {!generating && <ChevronDown />}
      </button>

      {open && !generating && (
        <div className="absolute right-0 z-50 w-56 mt-1 bg-white border rounded-lg shadow-lg border-slate-200 top-full">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">
            Select Report Type
          </p>
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onGenerate(r);
                setOpen(false);
              }}
              className="flex items-center w-full gap-2 px-3 py-2 text-sm text-left transition-colors text-slate-700 hover:bg-slate-50 last:rounded-b-lg"
            >
              <i className="fa-solid fa-file-lines" />
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────
const Pagination = ({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsChange,
  totalItems,
}) => {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to = Math.min(currentPage * rowsPerPage, totalItems);

  const delta = 2;
  const pages = [];
  for (
    let i = Math.max(1, currentPage - delta);
    i <= Math.min(totalPages, currentPage + delta);
    i++
  ) {
    pages.push(i);
  }

  const btnBase =
    "p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            onRowsChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="px-2 py-1 border rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          {ROWS_PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>
          {from}–{to} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={btnBase}
          title="First page"
        >
          <AnglesLeft />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={btnBase}
        >
          <ChevronLeft />
        </button>
        {pages[0] > 1 && <span className="px-1 text-slate-400">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${p === currentPage ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-700"}`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <span className="px-1 text-slate-400">…</span>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={btnBase}
        >
          <ChevronRight />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={btnBase}
          title="Last page"
        >
          <AnglesRight />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TEACHER DETAIL MODAL
// ─────────────────────────────────────────────
const TeacherDetailModal = ({
  teacher,
  onClose,
  tblPerformanceOverviewList,
  refRatingList,
  searchTermNo, // ✅ add
  searchAcadYear,
}) => {
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [studentPerfData, setStudentPerfData] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      setLoadingPerf(true);
      try {
        const res = await GetTeacherAttainmentByTeacherID({
          TeacherID: teacher.empID,
          Term: searchTermNo,
          SchoolYear: searchAcadYear,
        });
        setStudentPerfData(res);
      } catch {
        setStudentPerfData([]);
      } finally {
        setLoadingPerf(false);
      }
    };
    fetch_();
  }, [teacher.empID]);

  const filteredOverview = (tblPerformanceOverviewList || []).filter(
    (a) => a.observation?.teacherIdNo === teacher.empID,
  );

  const tdClass = "px-4 py-3 border-b border-slate-200";
  const thClass =
    "px-4 py-3 font-semibold text-left border-b text-slate-700 border-slate-200 whitespace-nowrap";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Teacher Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>

          {/* Teacher Identity */}
          <div className="flex items-center gap-4 pb-6 mb-4 border-b border-slate-200">
            <Avatar name={teacher.empName} size="lg" />
            <div>
              <h4 className="text-xl font-semibold text-slate-800">
                {teacher.empName}
              </h4>
              <p className="text-slate-600">{teacher.position}</p>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(teacher.averageRating)}
                <span className="text-sm text-slate-600">
                  ({getRatingName(teacher.averageRating, refRatingList)})
                </span>
              </div>
            </div>
          </div>

          {/* Joined Date */}
          <div className="mb-4">
            <p className="mb-1 text-sm text-slate-600">Joined Date</p>
            <p className="font-semibold text-slate-800">
              {formatDate(teacher.joinedDate)}
            </p>
          </div>

          {/* Performance Comments */}
          <CollapsibleSection title="Performance Comments">
            <div className="pb-4">
              {teacher.performanceManager ? (
                <div className="pt-2 space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-slate-600">
                      Performance Manager
                    </p>
                    <p className="font-semibold text-slate-800">
                      {teacher.performanceManager}
                    </p>
                  </div>
                  {[
                    ["Teaching Quality", teacher.teachingQuality],
                    ["Response to Students", teacher.responseToStudents],
                    ["Contributed to School", teacher.contribToSchool],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="mb-1 text-sm text-slate-600">{label}</p>
                      <p className="font-semibold text-slate-800">{val}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No Data Found" />
              )}
            </div>
          </CollapsibleSection>

          {/* Performance Overview */}
          <CollapsibleSection title="Performance Overview">
            <div className="py-4 overflow-x-auto">
              {filteredOverview.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      {OVERVIEW_HEADERS.map((h) => (
                        <th key={h} className={thClass}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOverview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className={tdClass}>
                          {row.observation.class || "-"}
                        </td>
                        <td className={tdClass}>
                          {row.observation.subject || "-"}
                        </td>
                        <td className={tdClass}>
                          {row.observation.topic || "-"}
                        </td>
                        <td className={tdClass}>
                          {row.observation.observerName || "-"}
                        </td>
                        <td className={tdClass}>
                          {renderStars(row.overallRatingValue)}{" "}
                          <span>({row.observation?.overallRating})</span>
                        </td>
                        <td className={tdClass}>
                          {renderStars(row.clearProgressRatingValue)}{" "}
                          <span>({row.observation?.clearProgressDemo})</span>
                        </td>
                        <td className={tdClass}>
                          {renderStars(row.demandPlacedRatingValue)}{" "}
                          <span>({row.observation?.demandPlaced})</span>
                        </td>
                        <td className={tdClass}>
                          {renderStars(row.effectivePlenaryRatingValue)}
                          <span>({row.observation?.effectivePlenary})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState message="No Data Found" />
              )}
            </div>
          </CollapsibleSection>

          {/* Teachers Attainment */}
          <CollapsibleSection title="Teachers Attainment">
            <div className="py-4">
              {loadingPerf ? (
                <div className="flex flex-col items-center py-10">
                  <i className="text-3xl text-blue-400 fa-solid fa-spinner fa-spin" />
                  <p className="mt-3 text-sm text-slate-600">
                    Loading attainment data…
                  </p>
                </div>
              ) : studentPerfData?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        {ATTAINMENT_HEADERS.map((h) => (
                          <th key={h} className={thClass}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentPerfData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className={tdClass}>{row.courseName || "-"}</td>
                          {GRADE_KEYS.map((k) => (
                            <td key={k} className={`${tdClass} text-center`}>
                              {row[k]}
                            </td>
                          ))}
                          <td
                            className={`${tdClass} text-center font-semibold text-green-600`}
                          >
                            {row.aboveExpected}
                          </td>
                          <td
                            className={`${tdClass} text-center font-semibold text-blue-600`}
                          >
                            {row.expected}
                          </td>
                          <td
                            className={`${tdClass} text-center font-semibold text-red-600`}
                          >
                            {row.belowExpected}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No attainment data found" />
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const TeachersPerformance = () => {
  const { TeacherPerformanceData, loading } = useReferenceData();
  const {
    refRatingList = [],
    acadYearsList = [],
    acadTermsList = [],
  } = TeacherPerformanceData;

  // ── Data state ───────────────────────────────────────────────────────────
  const [teacherList, setTeacherList] = useState([]);
  const [overviewList, setOverviewList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Search criteria ──────────────────────────────────────────────────────
  const [searchAcadYear, setSearchAcadYear] = useState("");
  const [searchTermNo, setSearchTermNo] = useState("");
  const [isDirty, setIsDirty] = useState(false); // true when criteria changed after search

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFiltersState] = useState(INITIAL_FILTERS);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedIDs, setSelectedIDs] = useState(new Set());

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setFilter = (key, value) => {
    setFiltersState((f) => ({ ...f, [key]: value }));
    setCurrentPage(1);
  };

  // ── Search criteria change handlers ─────────────────────────────────────
  // Mark dirty only if user already did a search (so banner doesn't show before first search)
  const handleAcadYearChange = (val) => {
    setSearchAcadYear(val);
    if (hasSearched) setIsDirty(true);
  };

  const handleTermChange = (val) => {
    setSearchTermNo(val);
    if (hasSearched) setIsDirty(true);
  };

  // ── Derived filter options ───────────────────────────────────────────────
  const departments = [
    "All",
    ...Array.from(
      new Map(
        teacherList.map((t) => {
          const dep = t.department?.trim() ?? "";
          return [dep.toLowerCase(), dep];
        }),
      ).values(),
    ).sort((a, b) => a.localeCompare(b)),
  ];
  const subjects = ["All", ...new Set(teacherList.map((t) => t.subject))];
  const statuses = ["All", ...new Set(teacherList.map((t) => t.status))];
  const terms = ["All", ...new Set(teacherList.map((t) => t.term?.toString()))];
  const acadYears = [
    "All",
    ...new Set(teacherList.map((t) => t.schoolYear?.toString())),
  ];

  const filterOptions = {
    academicYear: acadYears,
    term: terms,
    department: departments,
    subject: subjects,
    status: statuses,
  };

  // ── Filtered teachers ────────────────────────────────────────────────────
  // Fixed: only searches empID, empName, subject — case insensitive
  const { searchTerm, department, subject, status, term, academicYear } =
    filters;

  const filteredTeachers = teacherList.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.empID?.toLowerCase().includes(q) ||
      t.empName?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q);

    const matchesDepartment =
      department === "All" || t.department === department;
    const matchesSubject = subject === "All" || t.subject === subject;
    const matchesStatus = status === "All" || t.status === status;
    const matchesTerm = term === "All" || t.term?.toString() === term;
    const matchesAcadYear =
      academicYear === "All" || t.schoolYear?.toString() === academicYear;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesSubject &&
      matchesStatus &&
      matchesTerm &&
      matchesAcadYear
    );
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTeachers.length / rowsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageTeachers = filteredTeachers.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  // ── Checkbox helpers ─────────────────────────────────────────────────────
  const isAllPageSelected =
    pageTeachers.length > 0 &&
    pageTeachers.every((t) => selectedIDs.has(t.empID));
  const isIndeterminate =
    pageTeachers.some((t) => selectedIDs.has(t.empID)) && !isAllPageSelected;

  const toggleOne = (empID) =>
    setSelectedIDs((prev) => {
      const next = new Set(prev);
      next.has(empID) ? next.delete(empID) : next.add(empID);
      return next;
    });

  const toggleAllPage = () =>
    setSelectedIDs((prev) => {
      const next = new Set(prev);
      isAllPageSelected
        ? pageTeachers.forEach((t) => next.delete(t.empID))
        : pageTeachers.forEach((t) => next.add(t.empID));
      return next;
    });

  const toggleSelectAll = () => {
    setSelectedIDs(
      selectedIDs.size === filteredTeachers.length
        ? new Set()
        : new Set(filteredTeachers.map((t) => t.empID)),
    );
  };

  // ── Summary stats ────────────────────────────────────────────────────────
  const total = filteredTeachers.length;
  const avgRating = total
    ? (
        filteredTeachers.reduce((s, t) => s + (t.averageRating ?? 0), 0) / total
      ).toFixed(1)
    : 0;
  const avgAttendance = total
    ? Math.round(
        filteredTeachers.reduce((s, t) => s + (t.attendance ?? 0), 0) / total,
      )
    : 0;
  const ratingName = getRatingName(avgRating, refRatingList);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchTermNo) return;

    setSearching(true);
    setHasSearched(true);
    setIsDirty(false); // clear dirty flag on fresh search
    setCurrentPage(1);
    setSelectedIDs(new Set());
    setFiltersState(INITIAL_FILTERS); // reset table filters on new search

    try {
      const response = await getTeachersPerformanceInfoList({
        acadYear: searchAcadYear === "All" ? null : parseInt(searchAcadYear),
        acadTerm: parseInt(searchTermNo),
      });
      setTeacherList(
        Array.isArray(response?.teacherPerformanceInfoList)
          ? response.teacherPerformanceInfoList
          : [],
      );
      setOverviewList(
        Array.isArray(response?.tblPerformanceOverviewList)
          ? response.tblPerformanceOverviewList
          : [],
      );
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeacherList([]);
      setOverviewList([]);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setSearchAcadYear("");
    setSearchTermNo("");
    setTeacherList([]);
    setOverviewList([]);
    setHasSearched(false);
    setIsDirty(false);
    setSelectedIDs(new Set());
    setFiltersState(INITIAL_FILTERS);
    setCurrentPage(1);
    setShowMoreFilters(false);
  };

  const handleGenerateReport = async (reportType) => {
    const empIDS = filteredTeachers
      .filter((t) => selectedIDs.has(t.empID))
      .map((t) => t.empID);

    if (empIDS.length === 0) return;

    setGenerating(true);
    try {
      const blob = await generateTPOReportAsync({
        acadYear: searchAcadYear === "All" ? null : parseInt(searchAcadYear),
        acadTerm: parseInt(searchTermNo),
        empIDS,
      });
      downloadBlob(
        blob,
        empIDS.length > 1 ? "TPO_Reports.zip" : "TPO_Report.pdf",
      );
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  // ── Early return ─────────────────────────────────────────────────────────
  if (loading) return <SkeletonLargeBoxes />;

  const isTermMissing = !searchTermNo;
  const isAcadYearMissing = !searchAcadYear;

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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
        <StatCard
          label="Total Teachers"
          value={total}
          bg="bg-blue-100"
          icon={<Icon name="user-group" className="text-xl text-blue-600" />}
        />
        <StatCard
          label="Avg Rating"
          value={ratingName}
          bg="bg-yellow-100"
          icon={<Icon name="star" className="text-xl text-yellow-500" />}
        />
        <StatCard
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          bg="bg-green-100"
          icon={<Icon name="circle-check" className="text-xl text-green-600" />}
        />
      </div>

      {/* Search Panel */}
      <div className="p-4 mb-3 bg-white border rounded-lg shadow border-slate-200 space-y-4">
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Search
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Academic Year */}
          <div>
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={searchAcadYear}
              onChange={(e) => handleAcadYearChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isAcadYearMissing
                  ? "border-red-400 bg-red-50"
                  : "border-slate-300"
              }`}
            >
              <option value="" disabled>
                — Select a Year —
              </option>
              {acadYearsList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {isAcadYearMissing && (
              <p className="mt-1 text-xs text-red-500">
                Please select a year to search.
              </p>
            )}
          </div>

          {/* Term */}
          <div>
            <label className="block mb-1.5 text-sm font-medium text-slate-700">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              value={searchTermNo}
              onChange={(e) => handleTermChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isTermMissing ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            >
              <option value="" disabled>
                — Select a Term —
              </option>
              {acadTermsList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {isTermMissing && (
              <p className="mt-1 text-xs text-red-500">
                Please select a term to search.
              </p>
            )}
          </div>
        </div>

        {/* Dirty warning banner */}
        {isDirty && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 shrink-0" />
            <span>
              Search criteria has changed. The table below shows results from
              the previous search. Click <strong>Search</strong> to refresh.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleSearch}
            disabled={searching || isTermMissing || isAcadYearMissing}
            className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Icon name="magnifying-glass" />
            {searching ? "Searching…" : "Search"}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            <Icon name="rotate-left" />
            Reset
          </button>
          <div className="ml-auto">
            <GenerateReportButton
              onGenerate={handleGenerateReport}
              selectedCount={selectedIDs.size}
              generating={generating}
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {hasSearched && !searching && (
        <div className="p-4 mb-6 bg-white border rounded-lg shadow border-slate-200 space-y-4">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Filters
          </p>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
              <Icon name="magnifying-glass" />
            </div>
            <input
              type="text"
              placeholder="Search by Teacher ID, name, or subject…"
              value={filters.searchTerm}
              onChange={(e) => setFilter("searchTerm", e.target.value)}
              className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowMoreFilters((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            <Icon name="filter" />
            {showMoreFilters ? "Less Filters" : "More Filters"}
            {showMoreFilters ? <ChevronUp /> : <ChevronDown />}
          </button>

          {showMoreFilters && (
            <div className="grid grid-cols-1 gap-4 pt-4 border-t md:grid-cols-4 border-slate-200">
              {FILTER_FIELDS.map(({ label, key }) => (
                <SelectField
                  key={key}
                  label={label}
                  value={filters[key]}
                  onChange={(v) => setFilter(key, v)}
                  options={filterOptions[key]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table Area */}
      <div className="overflow-hidden bg-white border rounded-lg shadow border-slate-200">
        {searching && <SkeletonLargeBoxes />}

        {!searching && !hasSearched && (
          <div className="py-14 text-center text-slate-400">
            <Icon name="magnifying-glass" className="text-3xl mb-3 block" />
            <p className="text-sm">
              Select your criteria above and click <strong>Search</strong> to
              load teachers.
            </p>
          </div>
        )}

        {!searching && hasSearched && (
          <>
            {selectedIDs.size > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedIDs.size} of {filteredTeachers.length} teacher
                  {selectedIDs.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedIDs.size === filteredTeachers.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={() => setSelectedIDs(new Set())}
                    className="text-sm text-slate-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-slate-50 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={toggleAllPage}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </th>
                    {TABLE_HEADERS.map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 font-semibold text-slate-700 ${i >= 3 ? "text-center" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageTeachers.length > 0 ? (
                    pageTeachers.map((teacher) => (
                      <tr
                        key={teacher.empID}
                        className={`transition-colors border-b border-slate-100 hover:bg-slate-50 ${selectedIDs.has(teacher.empID) ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIDs.has(teacher.empID)}
                            onChange={() => toggleOne(teacher.empID)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={teacher.empName} size="sm" />
                            <div>
                              <p className="font-medium text-slate-800">
                                {teacher.empName}
                              </p>
                              <p className="text-sm text-slate-500">
                                {teacher.empID}
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
                          <div className="flex flex-col items-center gap-0.5">
                            {renderStars(teacher.averageRating)}
                            <span className="text-xs text-slate-500">
                              {getRatingName(
                                teacher.averageRating,
                                refRatingList,
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-semibold ${(teacher.attendance ?? 0) >= 95 ? "text-green-600" : "text-orange-600"}`}
                          >
                            {teacher.attendance}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge active={teacher.status === "Active"} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedTeacher(teacher)}
                            title="View Details"
                            className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Icon name="eye" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-500"
                      >
                        No teachers found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              totalItems={filteredTeachers.length}
              onPageChange={setCurrentPage}
              onRowsChange={setRowsPerPage}
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          tblPerformanceOverviewList={overviewList}
          refRatingList={refRatingList}
          searchTermNo={searchTermNo}
          searchAcadYear={searchAcadYear}
        />
      )}
    </div>
  );
};

export default TeachersPerformance;
