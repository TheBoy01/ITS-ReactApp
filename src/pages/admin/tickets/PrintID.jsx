import React, { useState, useEffect, useMemo } from "react";
import {
  getStudentListForPrinting,
  downloadIDCards,
} from "../../../API/TicketAPI";

// ─── Loading Overlay ────────────────────────────────────────────────────────
const LoadingOverlay = ({ message, subMessage }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[300px]">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 border-4 rounded-full border-t-blue-600 animate-spin" />
        <i className="text-xl text-blue-600 fas fa-id-card" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">{message}</p>
        {subMessage && (
          <p className="mt-1 text-sm text-gray-500">{subMessage}</p>
        )}
      </div>
    </div>
  </div>
);

// ─── Selectable Table ────────────────────────────────────────────────────────
const SelectableTable = ({
  data,
  columns,
  selectedIds,
  idKey,
  onToggleOne,
  onToggleAll,
  onClearAll,
  pageSize = 10,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allPageSelected =
    paged.length > 0 && paged.every((row) => selectedIds.includes(row[idKey]));
  const somePageSelected = paged.some((row) =>
    selectedIds.includes(row[idKey]),
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTogglePage = () => {
    const pageIds = paged.map((row) => row[idKey]);
    if (allPageSelected) {
      onToggleAll(pageIds, false);
    } else {
      onToggleAll(pageIds, true);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <i className="absolute text-xs text-gray-400 transform -translate-y-1/2 fas fa-search left-3 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search..."
            className="w-full py-2 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="flex-1 text-xs text-gray-500">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          {selectedIds.length > 0 && (
            <span className="ml-2 font-semibold text-blue-600">
              · {selectedIds.length} selected
            </span>
          )}
        </span>
        {selectedIds.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <i className="fas fa-times-circle" />
            Clear selection ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-10 px-4 py-2 text-left border border-gray-300">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el)
                      el.indeterminate = somePageSelected && !allPageSelected;
                  }}
                  onChange={handleTogglePage}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 font-semibold text-left text-gray-700 border border-gray-300"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr
                  key={row[idKey]}
                  onClick={() => onToggleOne(row[idKey])}
                  className={`cursor-pointer transition-colors ${
                    selectedIds.includes(row[idKey])
                      ? "bg-blue-50 hover:bg-blue-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row[idKey])}
                      onChange={() => onToggleOne(row[idKey])}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-2 text-gray-700 border border-gray-200"
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <i className="fas fa-angle-double-left" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <i className="fas fa-angle-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2 py-1 text-xs border rounded ${
                      p === safePage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <i className="fas fa-angle-right" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <i className="fas fa-angle-double-right" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const PrintID = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingSubMessage, setLoadingSubMessage] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const teachers = [
    {
      id: 1,
      name: "JOHN SMITH",
      subject: "Mathematics",
      department: "Science",
      staffCode: "T1001",
      photo:
        "https://auschool-my.sharepoint.com/personal/itsupport1_arabunityschool_ae/_layouts/15/download.aspx?UniqueId=95e0e11d-51e0-4ad4-9501-45d0a525d344&Translate=false&tempauth=v1.eyJzaXRlaWQiOiJlNDIxMTExOC1lOWQzLTRmOTItYTMzMi0zMzY0YzY2MjA3ZmMiLCJhcHBfZGlzcGxheW5hbWUiOiJUZWFjaGVyc0ltYWdlcyIsIm5hbWVpZCI6ImRjNTJkYTVhLTg4NzQtNGRmOS1hOTBlLTVhODY0OWY1MjljZkBlNTFhYTBkMy1lZWIyLTQ3ZTgtOWI3MS1mYTdlY2E3MGRkNzUiLCJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvYXVzY2hvb2wtbXkuc2hhcmVwb2ludC5jb21AZTUxYWEwZDMtZWViMi00N2U4LTliNzEtZmE3ZWNhNzBkZDc1IiwiZXhwIjoiMTc2NzYwMzEwMiJ9.CkAKDGVudHJhX2NsYWltcxIwQ09IWTdjb0dFQUFhRm1NMVNHZG9SM2xpU2xWTFVGSTBSRlkzUVRoaVFWRXFBQT09CjIKCmFjdG9yYXBwaWQSJDAwMDAwMDAzLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMAoKCgRzbmlkEgI2NBILCJiD28epjuY-EAUaCzIwLjIwLjQ0Ljk3KixZMW5INkNWRXc4bmVUcFlnRW1QaUxMSFhuKzc4K0VwbDdBWFdXTWdUbktrPTChATgBQhCh6fUMqUAA4O7vJ9h9u-hEShBoYXNoZWRwcm9vZnRva2VuegExugEbYWxsc2l0ZXMucmVhZCBhbGxmaWxlcy5yZWFkyAEB.f0305yf-_nqwOHh-5UCADUCpDBSOBnVr2vSpwZ6w6QY&ApiVersion=2.0",
    },
    {
      id: 2,
      name: "SARAH JOHNSON",
      subject: "English",
      department: "Languages",
      staffCode: "T1002",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=SJ",
    },
    {
      id: 3,
      name: "MICHAEL BROWN",
      subject: "Physics",
      department: "Science",
      staffCode: "T1003",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=MB",
    },
    {
      id: 4,
      name: "EMILY DAVIS",
      subject: "History",
      department: "Social Studies",
      staffCode: "T1004",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=ED",
    },
    {
      id: 5,
      name: "DAVID WILSON",
      subject: "Chemistry",
      department: "Science",
      staffCode: "T1005",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=DW",
    },
  ];

  useEffect(() => {
    loadReferencesData();
  }, []);

  const loadReferencesData = async () => {
    try {
      setDataLoading(true);
      const students = await getStudentListForPrinting();
      setStudentsList(students);
    } catch (error) {
      console.error("Error loading student list:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Toggle section — clears the OTHER section's selections automatically
  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      if (section === "teachers") setSelectedStudents([]);
      if (section === "students") setSelectedTeachers([]);
    }
  };

  // Teacher handlers
  const handleTeacherSelect = (id) =>
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  const handleBulkTeachers = (ids, add) =>
    setSelectedTeachers((prev) =>
      add
        ? [...new Set([...prev, ...ids])]
        : prev.filter((id) => !ids.includes(id)),
    );

  // Student handlers
  const handleStudentSelect = (id) =>
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  const handleBulkStudents = (ids, add) =>
    setSelectedStudents((prev) =>
      add
        ? [...new Set([...prev, ...ids])]
        : prev.filter((id) => !ids.includes(id)),
    );

  // Download — sends selected IDs to API, handles blob response
  const handleDownload = async () => {
    const isTeachers = activeSection === "teachers";
    const selectedIds = isTeachers ? selectedTeachers : selectedStudents;

    if (selectedIds.length === 0) {
      alert("Please select at least one person to download ID cards.");
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingMessage(
        `Generating ${selectedIds.length} ID card${selectedIds.length > 1 ? "s" : ""}...`,
      );
      setLoadingSubMessage("Please wait, this may take a moment.");

      const payload = {
        type: isTeachers ? "teacher" : "student",
        ids: selectedIds.map((id) => String(id)), // ← convert int to string
      };

      // Call your API — expects a Blob (zip/PDF) or any response
      const response = await downloadIDCards(payload);

      // Handle blob download (zip or PDF)
      if (response instanceof Blob) {
        const url = URL.createObjectURL(response);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ID_Cards_${isTeachers ? "Teachers" : "Students"}_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setLoadingMessage("Done!");
      setLoadingSubMessage(
        `${selectedIds.length} ID card${selectedIds.length > 1 ? "s" : ""} downloaded successfully.`,
      );

      // Brief success pause before closing
      await new Promise((r) => setTimeout(r, 1200));
    } catch (error) {
      console.error("Error downloading ID cards:", error);
      alert("Failed to download ID cards. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingMessage("");
      setLoadingSubMessage("");
    }
  };

  const selectedCount =
    activeSection === "teachers"
      ? selectedTeachers.length
      : selectedStudents.length;

  const isDownloadDisabled =
    isGenerating ||
    !activeSection ||
    (activeSection === "teachers" && selectedTeachers.length === 0) ||
    (activeSection === "students" && selectedStudents.length === 0);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* Full-screen loading overlay */}
      {isGenerating && (
        <LoadingOverlay
          message={loadingMessage}
          subMessage={loadingSubMessage}
        />
      )}

      <div className="max-w-6xl p-6 mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-2xl font-bold">
              <i className="mr-2 fas fa-id-card"></i>
              Print ID's
            </h2>
          </div>

          {/* Content */}
          {dataLoading ? (
            <div className="flex items-center justify-center p-16 bg-white border rounded-2xl border-slate-100">
              <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
              <p className="ml-3 text-sm text-slate-600">Loading records...</p>
            </div>
          ) : (
            <div className="p-6">
              {/* ── Teachers Section ── */}
              <div className="mb-4 overflow-hidden border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection("teachers")}
                  className="flex items-center justify-between w-full px-6 py-4 transition-colors bg-gray-50 hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                    <i className="fas fa-chalkboard-teacher"></i>
                    Teachers
                    {selectedTeachers.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                        {selectedTeachers.length}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedTeachers.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeachers([]);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-200 rounded-md cursor-pointer bg-red-50 hover:bg-red-100"
                      >
                        <i className="fas fa-rotate-left" />
                        Reset
                      </span>
                    )}
                    <i
                      className={`fas fa-chevron-down transform transition-transform duration-200 ${activeSection === "teachers" ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${activeSection === "teachers" ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
                >
                  <SelectableTable
                    data={teachers}
                    columns={[
                      { key: "staffCode", label: "Staff Code" },
                      { key: "name", label: "Name" },
                      { key: "subject", label: "Subject" },
                      { key: "department", label: "Department" },
                    ]}
                    selectedIds={selectedTeachers}
                    idKey="id"
                    onToggleOne={handleTeacherSelect}
                    onToggleAll={handleBulkTeachers}
                    onClearAll={() => setSelectedTeachers([])}
                    pageSize={10}
                  />
                </div>
              </div>

              {/* ── Students Section ── */}
              <div className="mb-6 overflow-hidden border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection("students")}
                  className="flex items-center justify-between w-full px-6 py-4 transition-colors bg-gray-50 hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                    <i className="fas fa-user-graduate"></i>
                    Students
                    {selectedStudents.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                        {selectedStudents.length}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedStudents.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudents([]);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-200 rounded-md cursor-pointer bg-red-50 hover:bg-red-100"
                      >
                        <i className="fas fa-rotate-left" />
                        Reset
                      </span>
                    )}
                    <i
                      className={`fas fa-chevron-down transform transition-transform duration-200 ${activeSection === "students" ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${activeSection === "students" ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
                >
                  <SelectableTable
                    data={studentsList}
                    columns={[
                      { key: "studentIDNo", label: "Student ID" },
                      { key: "studentName", label: "Name" },
                      { key: "gender", label: "Gender" },
                      { key: "department", label: "Grade" },
                      { key: "studentClass", label: "Section" },
                    ]}
                    selectedIds={selectedStudents}
                    idKey="studentIDNo"
                    onToggleOne={handleStudentSelect}
                    onToggleAll={handleBulkStudents}
                    onClearAll={() => setSelectedStudents([])}
                    pageSize={10}
                  />
                </div>
              </div>

              {/* ── Action Row ── */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectedCount > 0
                    ? `${selectedCount} ${activeSection === "teachers" ? "teacher" : "student"}${selectedCount > 1 ? "s" : ""} selected`
                    : "No selection yet"}
                </p>
                <button
                  onClick={handleDownload}
                  disabled={isDownloadDisabled}
                  className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-download" />
                  <span>
                    Download Selected ID{selectedCount !== 1 ? "s" : ""}
                    {selectedCount > 0 ? ` (${selectedCount})` : ""}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PrintID;
