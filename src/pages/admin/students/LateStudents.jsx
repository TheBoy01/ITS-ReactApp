import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  createLateStudentValidation,
  createLateStudent,
  searchLateStudentsList,
  getLateStudentsReferences,
  getStudentList,
  getStudentsPhotoByStudentIDNo,
} from "../../../API/Students";
import AuthContext from "../../../contexts/AuthContext";

// ─── npm install html5-qrcode ──────────────────────────────────────────────

// ─── QR Parser ─────────────────────────────────────────────────────────────
const parseStudentQR = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const parts = raw.split("|");
  if (parts.length < 5) return null;
  if (parts[0] !== "studentqrAUS") return null;
  const studentNumber = parts[4].trim();
  return studentNumber || null;
};

// ─── Permission Hook ───────────────────────────────────────────────────────
const usePermissions = () => {
  const { userMenus, loading } = useContext(AuthContext);

  const hasPermission = (menuName, action) => {
    if (!userMenus || userMenus.length === 0) return false;

    const menu = userMenus.find((m) => m.menuName === menuName);

    if (menu) {
      if (menu[action] !== undefined) {
        return menu[action];
      }

      if (menu.subMenus && menu.subMenus.length > 0) {
        const subMatch = menu.subMenus.find((sub) => sub.menuName === menuName);

        if (subMatch && subMatch[action] !== undefined) {
          return subMatch[action];
        }

        return menu.subMenus.some((sub) => sub[action] === true);
      }
    }

    for (const m of userMenus) {
      if (m.subMenus && m.subMenus.length > 0) {
        const sub = m.subMenus.find((s) => s.menuName === menuName);

        if (sub && sub[action] !== undefined) {
          return sub[action];
        }
      }
    }

    return false;
  };

  return { hasPermission, loading };
};

// ─── Task Toast ────────────────────────────────────────────────────────────
const TaskToast = ({ tasks }) => {
  if (tasks.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes spin-ring { to { transform: rotate(360deg); } }
        .spin-ring { animation: spin-ring 0.8s linear infinite; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .task-item { animation: fade-in-up 0.2s ease; }
      `}</style>
      <div className="fixed z-50 flex flex-col items-end gap-2 pointer-events-none bottom-5 right-5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-white border shadow-xl pointer-events-auto task-item border-slate-200 rounded-2xl text-slate-700"
            style={{ minWidth: 220, fontFamily: "'DM Sans', sans-serif" }}
          >
            {task.status === "loading" && (
              <svg
                className="flex-shrink-0 spin-ring"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  stroke="#e2e8f0"
                  strokeWidth="2.5"
                />
                <path
                  d="M9 2a7 7 0 0 1 7 7"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {task.status === "done" && (
              <svg
                className="flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <circle cx="9" cy="9" r="7" fill="#d1fae5" />
                <path
                  d="M5.5 9l2.5 2.5 4.5-4.5"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {task.status === "error" && (
              <svg
                className="flex-shrink-0"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <circle cx="9" cy="9" r="7" fill="#fee2e2" />
                <path
                  d="M6 6l6 6M12 6l-6 6"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate">{task.label}</p>
              {task.status === "error" && (
                <p className="text-xs font-normal text-rose-500 mt-0.5 truncate">
                  {task.errorMsg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Avatar ────────────────────────────────────────────────────────────────
const Avatar = ({ name, photoUrl, size = "sm" }) => {
  const dim =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "md"
        ? "w-10 h-10 text-sm"
        : size === "lg"
          ? "w-14 h-14 text-base"
          : "w-20 h-20 text-lg"; // xl

  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  if (photoUrl)
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  return (
    <div
      className={`${dim} rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

// ─── QR Scan Pane ──────────────────────────────────────────────────────────
const QRScanPane = ({
  submittedNumbers,
  addTask,
  updateTask,
  onSubmitSuccess,
  studentsList,
}) => {
  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const hasScannedRef = useRef(false);
  const scannerDivId = "qr-reader";
  const taskIdRef = useRef(0);
  const startScannerRef = useRef(null);

  const [student, setStudent] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [validating, setValidating] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setStudent(null);
    setRemarks("");
    setSubmitError("");
    isProcessingRef.current = false;
    hasScannedRef.current = false;
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;
    hasScannedRef.current = false;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (rawValue) => startScannerRef.current?.onScanned(rawValue),
        () => {},
      );
    } catch (err) {
      console.error("QR scanner failed to start:", err);
    }
  }, []);

  const onQRCodeScanned = useCallback(
    async (rawValue) => {
      if (isProcessingRef.current) return;
      if (hasScannedRef.current) return;

      const studentNumber = parseStudentQR(rawValue);
      if (!studentNumber) return;

      if (submittedNumbers.has(studentNumber)) {
        hasScannedRef.current = true;
        isProcessingRef.current = true;
        await stopScanner();

        const id = Date.now();
        addTask({
          id,
          label: "Already submitted",
          status: "error",
          errorMsg: `${studentNumber} is already marked late.`,
        });

        setTimeout(() => {
          updateTask(id, null);
          resetState();
          startScanner();
        }, 2000);

        return;
      }

      const parsedStudentNo = parseInt(studentNumber, 10);
      if (isNaN(parsedStudentNo)) {
        addTask({
          id: Date.now(),
          label: "Invalid student ID",
          status: "error",
          errorMsg: `Could not parse student number: "${studentNumber}"`,
        });
        return;
      }

      hasScannedRef.current = true;
      isProcessingRef.current = true;
      setValidating(true);
      setStudent(null);
      setRemarks("");
      setSubmitError("");
      await stopScanner();

      try {
        const studentData = await createLateStudentValidation({
          studentNo: parsedStudentNo,
        });

        const studentRecord = (studentsList ?? []).find(
          (s) => s.studentIDNo === parsedStudentNo,
        );

        try {
          const photoMap = await getStudentsPhotoByStudentIDNo([
            parsedStudentNo,
          ]);
          const photoUrl = photoMap[String(parsedStudentNo)] ?? null;
          setStudent({
            ...studentRecord,
            ...studentData,
            photoUrl,
            studentNo: parsedStudentNo,
          });
        } catch {
          setStudent({
            ...studentRecord,
            ...studentData,
            studentNo: parsedStudentNo,
          });
        }
      } catch (err) {
        const id = Date.now();
        addTask({
          id,
          label: `Not found: ${parsedStudentNo}`,
          status: "error",
          errorMsg:
            err?.response?.data?.message ?? err.message ?? "Student not found.",
        });
        setTimeout(() => updateTask(id, null), 3500);
        // Reset and restart scanner on error
        resetState();
        setTimeout(() => startScanner(), 800);
      } finally {
        setValidating(false);
        isProcessingRef.current = false;
      }
    },
    [
      submittedNumbers,
      addTask,
      updateTask,
      stopScanner,
      studentsList,
      resetState,
      startScanner,
    ],
  );

  // Keep ref in sync so startScanner callback always has latest onQRCodeScanned
  useEffect(() => {
    startScannerRef.current = { onScanned: onQRCodeScanned };
  }, [onQRCodeScanned]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleSubmit = async () => {
    if (!student) return;
    if (submittedNumbers.has(String(student.studentNo))) {
      setSubmitError("This student is already marked late in this session.");
      return;
    }
    setSubmitError("");
    const id = ++taskIdRef.current;
    addTask({
      id,
      label: `Submitting ${student.studentNo}…`,
      status: "loading",
    });
    try {
      await createLateStudent({
        studentNo: student.studentNo,
        remarks: remarks || "",
      });
      updateTask(id, {
        status: "done",
        label: `${student.studentNo} marked late`,
      });
      onSubmitSuccess(String(student.studentNo));
      setTimeout(() => updateTask(id, null), 3000);
      resetState();
      // ← delay scanner restart so QR code is no longer in view
      setTimeout(() => startScanner(), 2000);
    } catch (err) {
      updateTask(id, {
        status: "error",
        label: `Failed – ${student.studentNo}`,
        errorMsg:
          err?.response?.data?.message ?? err.message ?? "Submission failed.",
      });
      setSubmitError(
        err?.response?.data?.message ?? err.message ?? "Submission failed.",
      );
      setTimeout(() => updateTask(id, null), 5000);
    }
  };

  const handleCancel = async () => {
    resetState();
    setTimeout(() => startScanner(), 500); // ← small delay on cancel too
  };
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)]">
        <div className={student ? "hidden lg:block" : "block"}>
          <div
            className="rounded-2xl overflow-hidden bg-slate-900 relative border border-slate-800 shadow-sm"
            style={{ minHeight: 320 }}
          >
            {[
              "top-3 left-3 border-t-2 border-l-2 rounded-tl-md",
              "top-3 right-3 border-t-2 border-r-2 rounded-tr-md",
              "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md",
              "bottom-3 right-3 border-b-2 border-r-2 rounded-br-md",
            ].map((c, i) => (
              <div
                key={i}
                className={`absolute z-10 w-6 h-6 border-teal-400 pointer-events-none ${c}`}
              />
            ))}
            <div id={scannerDivId} className="w-full" />
            {validating && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-20">
                <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
                <span className="text-white text-sm font-medium">
                  Validating student…
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            Point the camera at the student's QR code — scanning automatically
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!student && (
            <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-col gap-2">
              <p className="text-sm font-semibold text-slate-800">
                QR Scanning
              </p>
              <p className="text-sm text-slate-500">
                Scan a student QR code from the left panel to validate and
                submit a late entry.
              </p>
            </div>
          )}

          {student && (
            <div className="bg-white rounded-2xl border border-teal-200 p-4 md:p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                  Student Found
                </p>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Cancel and rescan"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <Avatar
                  name={student.studentName}
                  photoUrl={student.photoUrl}
                  size="xl"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    {student.studentNo ?? student.studentIDNo}
                  </p>
                  <p className="text-sm text-slate-600 truncate">
                    {student.studentName}
                  </p>
                  <div className="flex gap-1.5 mt-1 flex-wrap justify-center sm:justify-start">
                    <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {student.groupLevel}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {student.class}
                    </span>
                    {student.classDept && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {student.classDept}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-teal-500 flex-shrink-0 hidden sm:block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Remarks{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Traffic, woke up late…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150"
              >
                Submit as Late
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Manual Search Pane ────────────────────────────────────────────────────
const ManualSearchPane = ({
  submittedNumbers,
  addTask,
  updateTask,
  onSubmitSuccess,
  studentsList,
  references, // ← add this
}) => {
  const [criteria, setCriteria] = useState({
    studentIDNo: "",
    studentName: "",
    class: "",
    groupLevel: "",
    classDept: "",
  });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);

  const [searching, setSearching] = useState(false);
  const taskIdRef = useRef(0);

  const update = (key, val) => setCriteria((p) => ({ ...p, [key]: val }));

  const handleSearch = async () => {
    const {
      studentIDNo,
      studentName,
      class: cls,
      groupLevel,
      classDept,
    } = criteria;
    const hasAnyCriteria =
      studentIDNo || studentName || cls || groupLevel || classDept;
    if (!hasAnyCriteria) {
      setError("Please enter at least one search criteria.");
      return;
    }
    setError("");
    setSelected(null);
    setRemarks("");
    setSearching(true); // ← start

    try {
      const filtered = (studentsList ?? [])
        .filter((s) => {
          return (
            (!studentIDNo ||
              String(s.studentIDNo)
                .toLowerCase()
                .includes(studentIDNo.toLowerCase())) &&
            (!studentName ||
              s.studentName
                ?.toLowerCase()
                .includes(studentName.toLowerCase())) &&
            (!cls || s.class?.toLowerCase().includes(cls.toLowerCase())) &&
            (!groupLevel ||
              s.groupLevel?.toLowerCase().includes(groupLevel.toLowerCase())) &&
            (!classDept ||
              s.classDept?.toLowerCase().includes(classDept.toLowerCase()))
          );
        })
        .filter((s) => !submittedNumbers.has(String(s.studentIDNo)));

      setResults(filtered);
      setSearched(true);

      if (filtered.length === 1) {
        try {
          const photoMap = await getStudentsPhotoByStudentIDNo([
            filtered[0].studentIDNo,
          ]);
          filtered[0].photoUrl =
            photoMap[String(filtered[0].studentIDNo)] ?? null;
        } catch {}
        handleSelect(filtered[0]);
        return;
      }

      if (filtered.length <= 30) {
        try {
          const ids = filtered.map((s) => s.studentIDNo);
          const photoMap = await getStudentsPhotoByStudentIDNo(ids);
          setResults((prev) =>
            prev.map((s) => ({
              ...s,
              photoUrl: photoMap[String(s.studentIDNo)] ?? null,
            })),
          );
        } catch {}
      }
    } finally {
      setSearching(false); // ← stop
    }
  };

  const handleSelect = async (s) => {
    setError("");
    setValidating(true);
    try {
      const studentData = await createLateStudentValidation({
        studentNo: s.studentIDNo,
      });
      setSelected({ ...s, ...studentData });
      setRemarks("");
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          err.message ??
          "Student validation failed.",
      );
    } finally {
      setValidating(false);
    }
  };

  const handleClear = () => {
    setSelected(null);
    setRemarks("");
    setError("");
  };

  const handleReset = () => {
    setCriteria({
      studentIDNo: "",
      studentName: "",
      class: "",
      groupLevel: "",
      classDept: "",
    });
    setResults([]);
    setSearched(false);
    setSelected(null);
    setRemarks("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (submittedNumbers.has(String(selected.studentIDNo))) {
      setError("This student is already marked late in this session.");
      return;
    }
    setError("");
    const id = ++taskIdRef.current;
    addTask({
      id,
      label: `Submitting ${selected.studentIDNo}…`,
      status: "loading",
    });
    try {
      await createLateStudent({
        studentNo: selected.studentIDNo,
        remarks: remarks || "",
      });
      updateTask(id, {
        status: "done",
        label: `${selected.studentIDNo} marked late`,
      });
      onSubmitSuccess(String(selected.studentIDNo));
      handleClear();
      setResults([]);
      setSearched(false);
      setCriteria({
        studentIDNo: "",
        studentName: "",
        class: "",
        groupLevel: "",
        classDept: "",
      });
      setTimeout(() => updateTask(id, null), 3000);
    } catch (err) {
      updateTask(id, {
        status: "error",
        label: `Failed – ${selected.studentIDNo}`,
        errorMsg:
          err?.response?.data?.message ?? err.message ?? "Submission failed.",
      });
      setError(
        err?.response?.data?.message ?? err.message ?? "Submission failed.",
      );
      setTimeout(() => updateTask(id, null), 5000);
    }
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* Search Criteria */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm flex flex-col gap-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Search Criteria
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Student ID No
            </label>
            <input
              type="text"
              value={criteria.studentIDNo}
              onChange={(e) => update("studentIDNo", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 10023"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Student Name
            </label>
            <input
              type="text"
              value={criteria.studentName}
              onChange={(e) => update("studentName", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Juan dela Cruz"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Group Level
            </label>
            <select
              value={criteria.groupLevel}
              onChange={(e) => update("groupLevel", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            >
              <option value="">All</option>
              {(references.groupLevel ?? []).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Class Department
            </label>
            <select
              value={criteria.classDept}
              onChange={(e) => update("classDept", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            >
              <option value="">All</option>
              {(references.classDept ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Class</label>
            <input
              type="text"
              value={criteria.class}
              onChange={(e) => update("class", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 10-A"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={validating || searching}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 active:scale-95 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <i className="text-sm text-white fa-solid fa-spinner fa-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={validating || searching}
              className="flex-none bg-slate-100 hover:bg-slate-200 disabled:opacity-60 active:scale-95 text-slate-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2"
              title="Clear all fields"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Clear
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Selected Student Card */}
      {selected && !searching && (
        <div className="bg-white rounded-2xl border border-teal-200 p-4 md:p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
              Selected Student
            </p>
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            <Avatar
              name={selected.studentName}
              photoUrl={selected.photoUrl}
              size="xl"
            />
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-800">
                {selected.studentIDNo}
              </p>
              <p className="text-sm text-slate-600 truncate">
                {selected.studentName}
              </p>
              <div className="flex gap-1.5 mt-1 flex-wrap justify-center sm:justify-start">
                <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  {selected.groupLevel}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {selected.class}
                </span>
                {selected.classDept && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {selected.classDept}
                  </span>
                )}
              </div>
            </div>
            <svg
              className="w-5 h-5 text-teal-500 flex-shrink-0 hidden sm:block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Remarks{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Traffic, woke up late…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150"
          >
            Submit as Late
          </button>
        </div>
      )}

      {/* Searching spinner */}
      {searching && (
        <div className="flex items-center justify-center py-8 gap-3">
          <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
          <span className="text-sm text-slate-500">Searching students…</span>
        </div>
      )}

      {/* Validating spinner */}
      {validating && !searching && (
        <div className="flex items-center justify-center py-8 gap-3">
          <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
          <span className="text-sm text-slate-500">Validating student…</span>
        </div>
      )}

      {/* Results Table */}
      {searched && !selected && !validating && !searching && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Results
            </p>
            <span className="text-xs text-slate-400">
              {results.length} student{results.length !== 1 ? "s" : ""} found
            </span>
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                No students match your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      ID No
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Class
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Group Level
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Dept
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((s) => (
                    <tr
                      key={s.studentIDNo}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Avatar
                          name={s.studentName}
                          photoUrl={s.photoUrl}
                          size="xl"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {s.studentIDNo}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {s.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {s.class ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {s.groupLevel ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {s.classDept ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSelect(s)}
                          className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Create Tab ────────────────────────────────────────────────────────────
// In CreateTab props, add studentsList
// ─── Create Tab ────────────────────────────────────────────────────────────
const CreateTab = ({
  submittedNumbers,
  addTask,
  updateTask,
  onSubmitSuccess,
  studentsList,
  references,
}) => {
  const [subTab, setSubTab] = useState("scan");
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex border border-slate-200 rounded-2xl bg-white overflow-hidden w-full md:w-fit">
          {[
            {
              key: "scan",
              label: "Scan QR Code",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    strokeWidth={1.8}
                  />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    strokeWidth={1.8}
                  />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    strokeWidth={1.8}
                  />
                  <path
                    d="M14 14h3v3M17 14v3M14 17h3"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </svg>
              ),
            },
            {
              key: "manual",
              label: "Manual Search",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
              ),
            },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 md:border-b-0 md:border-r last:md:border-r-0 transition-colors ${
                subTab === key
                  ? "border-teal-500 text-teal-600 bg-teal-50"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {subTab === "scan" && (
          <QRScanPane
            submittedNumbers={submittedNumbers}
            addTask={addTask}
            updateTask={updateTask}
            onSubmitSuccess={onSubmitSuccess}
            studentsList={studentsList} // ← add this
          />
        )}
        {subTab === "manual" && (
          <ManualSearchPane
            submittedNumbers={submittedNumbers}
            addTask={addTask}
            updateTask={updateTask}
            onSubmitSuccess={onSubmitSuccess}
            studentsList={studentsList}
            references={references}
          />
        )}
      </div>
    </div>
  );
};

// ─── View Tab ──────────────────────────────────────────────────────────────

const ViewTab = ({ references }) => {
  const [searchParams, setSearchParams] = useState({
    academicYear: "",
    term: "",
    yearLevel: "",
    className: "",
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
  });

  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const update = (key, val) => setSearchParams((p) => ({ ...p, [key]: val }));

  const validateSearch = () => {
    if (!searchParams.academicYear) return "Academic Year is required.";
    if (!searchParams.term) return "Term is required.";
    return "";
  };

  const handleSearch = async () => {
    const err = validateSearch();
    if (err) {
      setSearchError(err);
      return;
    }
    setSearchError("");
    setSearching(true);
    try {
      // Ensure this function is imported or defined in your scope
      const data = await searchLateStudentsList(searchParams);
      setResults(data ?? []);
      setSearched(true);
      setFilterText("");
    } catch (e) {
      setSearchError(
        e?.response?.data?.message ?? e.message ?? "Search failed.",
      );
    } finally {
      setSearching(false);
    }
  };

  // ── Grouping Logic: Collapses individual days into Student Summaries ──────
  const grouped = useMemo(() => {
    const map = {};

    (results ?? []).forEach((r) => {
      const id = r.studentIDNo;
      if (!map[id]) {
        map[id] = {
          studentIDNo: id,
          studentName: r.studentName,
          acadYear: r.acadYear,
          term: r.term,
          class: r.class,
          classDept: r.classDept,
          // Match the property name from your Backend DTO
          totalInTerm: r.totalLateDays,
          records: [],
        };
      }
      // Push the individual row into the records array for the Modal
      map[id].records.push(r);
    });

    return Object.values(map);
  }, [results]);

  // ── Client-side filtering within the results ──────────────────────────────
  const filtered = useMemo(() => {
    const t = filterText.toLowerCase();
    return !t
      ? grouped
      : grouped.filter(
          (g) =>
            g.studentName?.toLowerCase().includes(t) ||
            String(g.studentIDNo).includes(t),
        );
  }, [grouped, filterText]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4 md:p-6">
          {/* ── SEARCH CRITERIA ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm flex flex-col gap-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Search Criteria
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Academic Year */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Academic Year <span className="text-red-400">*</span>
                </label>
                <select
                  value={searchParams.academicYear}
                  onChange={(e) => update("academicYear", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select…</option>
                  {(references?.acadYear ?? []).map((y) => (
                    <option key={y} value={y}>
                      {y} - {parseInt(y) + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Term <span className="text-red-400">*</span>
                </label>
                <select
                  value={searchParams.term}
                  onChange={(e) => update("term", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select…</option>
                  {(references?.term ?? []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Level */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Year Level
                </label>
                <select
                  value={searchParams.yearLevel}
                  onChange={(e) => update("yearLevel", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">All</option>
                  {(references?.groupLevel ?? []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Name */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Class
                </label>
                <input
                  type="text"
                  value={searchParams.className}
                  onChange={(e) => update("className", e.target.value)}
                  placeholder="e.g. 10-A"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Date From
                </label>
                <input
                  type="date"
                  value={searchParams.dateFrom}
                  onChange={(e) => update("dateFrom", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Date To
                </label>
                <input
                  type="date"
                  value={searchParams.dateTo}
                  onChange={(e) => update("dateTo", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50"
                />
              </div>

              {/* Search Button */}
              <div className="md:col-span-2 xl:col-span-2 flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {searching ? "Searching…" : "Search Records"}
                </button>
              </div>
            </div>

            {searchError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {searchError}
              </p>
            )}
          </div>

          {/* ── RESULTS SECTION ────────────────────────────────────────────── */}
          {searched && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter by name or ID within results…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filtered.map((g) => (
                  <div
                    key={g.studentIDNo}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {g.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {g.studentIDNo}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(g)}
                        className="text-xs font-semibold text-teal-600 border border-teal-200 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-600">
                          Level:
                        </span>{" "}
                        {g.class}
                      </span>
                      <span>
                        <span className="font-medium text-slate-600">
                          Class:
                        </span>{" "}
                        {g.classDept}
                      </span>
                      <span className="col-span-2">
                        <span className="font-medium text-slate-600">
                          Total Days Late (Term {searchParams.term}):
                        </span>{" "}
                        <span className="text-red-500 font-bold">
                          {g.totalInTerm}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedStudent.studentName}
                </p>
                <p className="text-xs text-slate-500">Late History</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex flex-col gap-2">
              {selectedStudent.records.map((r, i) => {
                const dateObj = new Date(r.lateDateTime);

                // Format: Monday, April 13, 2026
                const datePart = dateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });

                // Format: 3:00 PM
                const timePart = dateObj.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs border-l-4 border-teal-500"
                  >
                    <span className="text-slate-700 font-semibold">
                      {datePart} <span className="text-slate-400 mx-1">—</span>{" "}
                      {timePart}
                    </span>{" "}
                    <span className="text-slate-500 italic bg-white px-2 py-1 rounded border border-slate-100">
                      Gate: {r.gateEntryDesc || " "}
                    </span>
                    <span className="text-slate-500 italic bg-white px-2 py-1 rounded border border-slate-100">
                      {r.remarks || "No remarks"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t text-right text-xs text-slate-500 bg-slate-50">
              Showing {selectedStudent.records.length} records for selected
              dates.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const LateStudents = () => {
  const { hasPermission, loading } = usePermissions();

  const canCreate = hasPermission("Late Students", "canCreate");
  const canView = hasPermission("Late Students", "canView");

  const [references, setReferences] = useState({ acadYear: [], term: [] });
  const [studentsList, setStudentsList] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [refsError, setRefsError] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [tasks, setTasks] = useState([]);
  const [submittedNumbers, setSubmittedNumbers] = useState(new Set());

  const [sharedSearchParams] = useState({
    academicYear: "",
    term: "",
    yearLevel: "",
    className: "",
  });

  useEffect(() => {
    if (!canView && !canCreate) return;
    const load = async () => {
      try {
        const data = await getLateStudentsReferences();
        const studentsListData = await getStudentList();
        setStudentsList(studentsListData);
        setReferences(
          data ?? { acadYear: [], term: [], groupLevel: [], classDept: [] },
        );
      } catch (e) {
        setRefsError(
          e?.response?.data?.message ??
            e.message ??
            "Failed to load references.",
        );
      } finally {
        setRefsLoading(false);
      }
    };
    load();
  }, [canView, canCreate]);

  useEffect(() => {
    if (canCreate) setActiveTab("create");
    else if (canView) setActiveTab("view");
  }, [canCreate, canView]);

  const addTask = useCallback((task) => setTasks((p) => [...p, task]), []);
  const updateTask = useCallback((id, patch) => {
    if (patch === null) setTasks((p) => p.filter((t) => t.id !== id));
    else setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);
  const handleSubmitSuccess = useCallback((sn) => {
    setSubmittedNumbers((p) => new Set([...p, sn]));
  }, []);

  if (loading || refsLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
      </div>
    );

  if (!canCreate && !canView)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50">
        <i className="text-5xl fa-solid fa-lock text-rose-400" />
        <p className="font-bold text-slate-800">Access Denied</p>
      </div>
    );

  if (refsError)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-8">
          <p className="text-red-500 text-sm mb-3">{refsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-teal-600 underline text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const showBothTabs = canCreate && canView;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-teal-700 px-4 md:px-6 lg:px-8 pt-5 pb-0 md:rounded-b-3xl shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-white text-2xl md:text-3xl font-semibold">
                  Late Students
                </h1>
                <p className="text-teal-300 text-sm mt-0.5 mb-4">
                  Add and view late student entries
                </p>
              </div>
            </div>

            {showBothTabs && (
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 md:flex-none md:min-w-[180px] flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "create"
                      ? "border-white text-white"
                      : "border-transparent text-teal-300 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Late
                </button>
                <button
                  onClick={() => setActiveTab("view")}
                  className={`flex-1 md:flex-none md:min-w-[220px] flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "view"
                      ? "border-white text-white"
                      : "border-transparent text-teal-300 hover:text-white"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                  View Late Students
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content shell */}
        <div className="px-0 md:px-4 lg:px-6 py-0 md:py-6">
          <div className="bg-transparent md:bg-white md:border md:border-slate-200 md:rounded-3xl md:shadow-sm overflow-hidden min-h-[calc(100vh-180px)]">
            <div className="flex flex-col flex-1 overflow-hidden">
              {activeTab === "create" && canCreate && (
                <CreateTab
                  submittedNumbers={submittedNumbers}
                  addTask={addTask}
                  updateTask={updateTask}
                  onSubmitSuccess={handleSubmitSuccess}
                  studentsList={studentsList}
                  references={references} // ← add this
                />
              )}
              {activeTab === "view" && canView && (
                <ViewTab references={references} />
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskToast tasks={tasks} />
    </div>
  );
};

export default LateStudents;
