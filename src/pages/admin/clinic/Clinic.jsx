import { useState, useRef, useEffect, useContext, useCallback } from "react";
import {
  getStudentByStudentIDNo,
  createRecordValidation,
  createRecordAsync,
  getClinicRecordListByClinicDept,
  createNewRecordConnection,
  getRecordAttachments,
  updateClinicRecordAsync,
  //updateRecordValidation,
} from "../../../API/ClinicAPI";
import AuthContext from "../../../contexts/AuthContext";
import { SwalError, SwalConfirm } from "../../../utils/SwalAlert";
// ─────────────────────────────────────────────────────────────
// useAsyncTask
//
// Runs any async function as a background task and surfaces
// its state to the TaskToast component.
//
// USAGE:
//   const { run, tasks } = useAsyncTask();
//
//   run(() => createRecordValidation(form), {
//     label: "Saving John Doe…",
//     onSuccess: (result) => console.log(result),
//     onError:   (error)  => SwalError(error.message),
//   });
//
//   <TaskToast tasks={tasks} />
// ─────────────────────────────────────────────────────────────
export const useAsyncTask = () => {
  const [tasks, setTasks] = useState([]);

  const run = useCallback(
    async (asyncFn, { label = "Processing…", onSuccess, onError } = {}) => {
      const id = crypto.randomUUID();

      setTasks((prev) => [...prev, { id, label, status: "loading" }]);

      try {
        const result = await asyncFn();

        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)),
        );

        // Auto-remove after 2.5 s
        setTimeout(
          () => setTasks((prev) => prev.filter((t) => t.id !== id)),
          2500,
        );

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMsg =
          error?.response?.data?.title ||
          error?.message ||
          "Something went wrong";

        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "error", errorMsg } : t,
          ),
        );

        // Auto-remove errors after 5 s
        setTimeout(
          () => setTasks((prev) => prev.filter((t) => t.id !== id)),
          5000,
        );

        onError?.(error);
      }
    },
    [],
  );

  return { run, tasks };
};

// ─────────────────────────────────────────────────────────────
// TaskToast
//
// Floating panel at the bottom-right that shows one row per
// running/completed/failed task. Drop it anywhere in your JSX.
//
// USAGE:
//   <TaskToast tasks={tasks} />
// ─────────────────────────────────────────────────────────────
export const TaskToast = ({ tasks }) => {
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
            {/* Spinner */}
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
            {/* Done check */}
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
            {/* Error X */}
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

// ─────────────────────────────────────────────────────────────
// Permissions hook
// ─────────────────────────────────────────────────────────────
const usePermissions = () => {
  const { userMenus, loading } = useContext(AuthContext);
  const hasPermission = (menuName, action) => {
    const menu = userMenus.find((m) => m.menuName === menuName);
    if (!menu) return false;
    return menu[action];
  };
  return { hasPermission, loading };
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const MAX_SIZE = 3 * 1024 * 1024;
const fmtBytes = (b) => {
  if (!b) return "";
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / 1024 ** i).toFixed(1)} ${["B", "KB", "MB"][i]}`;
};
const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const fetchStudentById = async (id) => {
  await new Promise((r) => setTimeout(r, 800));
  const result = await getStudentByStudentIDNo(id.trim());
  if (!result) throw new Error("Student not found.");
  return result;
};

const date = new Date();
date.setHours(date.getHours() + 4);

const EMPTY_FORM = {
  studentId: "",
  studentName: "",
  grade: "",
  section: "",
  photoUrl: "",
  visitDate: date.toISOString().slice(0, 16),
  nal: "",
  condition: "",
  actionTaken: "",
  nurseAttendant: "",
  attachments: [],
  fileSize: 0,
};

// ─────────────────────────────────────────────────────────────
// Primitive UI components
// ─────────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <span className="block text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-1">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </span>
);

const ReadField = ({ label, value, placeholder = "—" }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center gap-2 py-2 border-b border-dashed border-slate-200">
      <span
        className={`text-sm font-medium ${value ? "text-slate-900" : "text-slate-400 italic"}`}
      >
        {value || placeholder}
      </span>
      {value && <i className="fa-solid fa-lock text-[9px] text-slate-500" />}
    </div>
  </div>
);

const EditInput = ({ label, required, ...props }) => (
  <div>
    <Label required={required}>{label}</Label>
    <input
      required={required}
      {...props}
      className="w-full py-2 text-sm transition-colors bg-transparent border-b-2 outline-none border-slate-200 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
    />
  </div>
);

const EditTextarea = ({ label, required, maxLength, ...props }) => {
  const current = (props.value || "").length;
  const nearLimit = maxLength && current >= maxLength * 0.85;
  const atLimit = maxLength && current >= maxLength;
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <Label required={required}>{label}</Label>
        {maxLength && (
          <span
            className={`text-[10px] font-semibold tabular-nums transition-colors ${atLimit ? "text-rose-500" : nearLimit ? "text-amber-500" : "text-slate-400"}`}
          >
            {current}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        required={required}
        maxLength={maxLength}
        {...props}
        className="w-full py-2 text-sm transition-colors bg-transparent border-b-2 outline-none resize-none border-slate-200 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
};

const Attachments = ({ files = [], onChange }) => {
  const ref = useRef();
  const [err, setErr] = useState("");
  const pick = (e) => {
    setErr("");
    const all = Array.from(e.target.files);
    const valid = [],
      bad = [];
    all.forEach((f) => (f.size > MAX_SIZE ? bad.push(f.name) : valid.push(f)));
    if (bad.length) setErr(`Over 3 MB: ${bad.join(", ")}`);
    if (valid.length)
      onChange([
        ...files,
        ...valid.map((f) => ({
          file: f,
          preview: URL.createObjectURL(f),
          name: f.name,
          size: f.size,
        })),
      ]);
    e.target.value = "";
  };
  return (
    <div className="flex flex-col gap-3">
      <Label>
        Photo Attachments{" "}
        <span className="font-normal normal-case text-slate-500">
          (max 3 MB total)
          {files.length > 0 &&
            ` - ${fmtBytes(files.reduce((sum, f) => sum + f.size, 0))} used`}
        </span>
      </Label>
      <button
        type="button"
        onClick={() => ref.current.click()}
        className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm transition-colors border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl text-slate-600 hover:text-teal-600"
      >
        <i className="fa-solid fa-cloud-arrow-up" /> Attach images
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={pick}
      />
      {err && (
        <p className="flex items-center gap-1 text-xs text-rose-500">
          <i className="fa-solid fa-triangle-exclamation" /> {err}
        </p>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative w-16 h-16 group">
              <img
                src={f.preview ?? f.downloadUrl}
                className="object-cover w-full h-full border rounded-lg border-slate-200"
                alt=""
              />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, x) => x !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] hidden group-hover:flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              <p className="text-[9px] text-slate-500 text-center mt-0.5">
                {fmtBytes(f.size)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Clinic — main component
// ─────────────────────────────────────────────────────────────
const Clinic = () => {
  const { hasPermission, loading } = usePermissions();
  const { user } = useContext(AuthContext);

  // ── Hook: one line to get run + tasks ──
  const { run, tasks } = useAsyncTask();

  const [tab, setTab] = useState("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false); // Add loading state
  const [idInput, setIdInput] = useState("");
  const [lookupState, setLookupState] = useState("idle");
  const [lookupError, setLookupError] = useState("");
  const debounceRef = useRef(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("visitDate");
  const [sortOrder, setSortOrder] = useState("desc");

  const [viewModalRecord, setViewModalRecord] = useState(null);
  const [studentCache, setStudentCache] = useState({});

  // ✅ Load records when component mounts
  useEffect(() => {
    loadRecords();
  }, []);

  // ✅ Function to load records from API
  const loadRecords = async () => {
    try {
      setRecordsLoading(true);
      const data = await getClinicRecordListByClinicDept(); // or user.empCode, depending on your API
      setRecords(data || []);
    } catch (error) {
      console.error("Failed to load records:", error);
      SwalError("Failed to load records. Please try again.");
    } finally {
      setRecordsLoading(false);
    }
  };

  // ✅ SignalR Connection Setup
  useEffect(() => {
    const connection = createNewRecordConnection();
    let isMounted = true; // ✅ track if still mounted

    connection.onreconnecting(() => console.log("SignalR Reconnecting..."));
    connection.onreconnected(() => console.log("SignalR Reconnected"));
    connection.onclose((err) => console.log("SignalR Closed", err));

    const startConnection = async () => {
      try {
        await connection.start();
        if (isMounted) console.log("SignalR Connected");
      } catch (err) {
        if (isMounted) {
          console.error("SignalR Connection Error:", err);
          setTimeout(startConnection, 5000); // only retry if still mounted
        }
      }
    };

    startConnection();

    connection.on("ReceiveNewRecord", (newRecord) => {
      setRecords((prev) => {
        if (prev.some((r) => r.recordNo === newRecord.recordNo)) return prev;
        return [newRecord, ...prev];
      });
    });

    connection.on("ReceiveRecordUpdate", (updatedRecord) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.recordNo === updatedRecord.recordNo ? updatedRecord : r,
        ),
      );
    });

    return () => {
      isMounted = false; // ✅ cancel retry on unmount
      connection.stop();
    };
  }, []);

  useEffect(() => {
    if (!idInput.trim()) {
      setLookupState("idle");
      setLookupError("");
      setForm((p) => ({
        ...p,
        studentId: "",
        studentName: "",
        grade: "",
        section: "",
        photoUrl: "",
        empCode: user.empCode,
      }));
      return;
    }
    setLookupState("loading");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const s = await fetchStudentById(idInput);
        setForm((p) => ({
          ...p,
          studentId: s.studentIDNo,
          studentName: s.studentName,
          gender: s.gender,
          class: s.class,
          groupLevel: s.groupLevel,
          classDept: s.classDept,
          birthDate: s.dateOfBirth,
          nationality: s.nationality,
          photoUrl: s.photoUrl,
          empCode: user.empCode,
        }));
        setLookupState("found");
        setLookupError("");
      } catch (e) {
        setLookupState("error");
        setLookupError(e.message);
        setForm((p) => ({
          ...p,
          studentId: "",
          studentName: "",
          gender: "",
          class: "",
          groupLevel: "",
          classDept: "",
          birthDate: "",
          nationality: "",
          photoUrl: "",
          empCode: user.empCode,
        }));
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [idInput]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
      </div>
    );

  if (!hasPermission("Clinic", "canView"))
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50">
        <i className="text-5xl fa-solid fa-lock text-rose-400" />
        <p className="font-bold text-slate-800">Access Denied</p>
      </div>
    );

  const canCreate = hasPermission("Clinic", "canCreate");
  const canEdit = hasPermission("Clinic", "canEdit");
  const canDelete = hasPermission("Clinic", "canDelete");
  const canView = hasPermission("Clinic", "canView");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      visitDate: date.toISOString().slice(0, 16),
    });
    setIdInput("");
    setLookupState("idle");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && lookupState !== "found") return;

    try {
      // Step 1: validate first (your original process)

      const ClinicRecordDTO = new FormData();

      // Append normal fields

      if (isEditing) {
        ClinicRecordDTO.append("RecordNo", form.recordNo);
      }
      ClinicRecordDTO.append("studentId", form.studentId);
      ClinicRecordDTO.append("VisitDate", form.visitDate);
      ClinicRecordDTO.append("NAL", form.nal);
      ClinicRecordDTO.append("Condition", form.condition);
      ClinicRecordDTO.append("ActionTaken", form.actionTaken);
      ClinicRecordDTO.append("NurseAttendant", form.nurseAttendant);
      ClinicRecordDTO.append("EmpCode", form.empCode);
      ClinicRecordDTO.append(
        "FileSize",
        form.attachments.reduce((sum, att) => sum + att.size, 0),
      );

      // Append files
      //if (form.attachments) {
      // form.attachments.forEach((f) => {
      //    if (f.isExisting) return; // ✅ don't re-upload existing attachments
      //  console.log("Appending file to DTO:", f);
      //  ClinicRecordDTO.append("Attachments", f.file, f.name); // append the actual File object
      //  });
      //  }
      const attachments = form.attachments ?? [];
      ClinicRecordDTO.append(
        "FileSize",
        attachments.reduce((sum, att) => sum + att.size, 0),
      );
      // Handle attachments — re-fetch existing ones as blobs, upload new ones as-is
      if (attachments.length > 0) {
        for (const f of attachments) {
          if (f.isExisting) {
            try {
              const response = await fetch(f.downloadUrl);
              const blob = await response.blob();
              const file = new File([blob], f.name, { type: blob.type });
              ClinicRecordDTO.append("Attachments", file, f.name);
            } catch (err) {
              console.error(
                "Failed to re-fetch existing attachment:",
                f.name,
                err,
              );
            }
          } else {
            ClinicRecordDTO.append("Attachments", f.file, f.name);
          }
        }
      }

      //const result = isEditing
      //? await createRecordValidation(ClinicRecordDTO)
      // : await createRecordValidation(ClinicRecordDTO);
      const result = await createRecordValidation(ClinicRecordDTO);
      if (!result.isSuccessful) {
        SwalError(`Failed: ${result.status}`);
        return;
      }

      // Step 2: confirm after validation passes
      const confirmed = await SwalConfirm(
        isEditing ? "Update Record" : "Save Record",
        `Are you sure you want to ${isEditing ? "update" : "save"} this record?`,
      );
      if (!confirmed) return;

      const snapshot = { ...form };
      const isUpdate = isEditing;

      resetForm(); // reset immediately

      // setTab("records"); // ✅ ADD THIS LINE - Switch to records tab

      // Step 3: fire the actual save as a background task

      run(
        () =>
          isUpdate
            ? updateClinicRecordAsync(ClinicRecordDTO)
            : createRecordAsync(ClinicRecordDTO),
        {
          label: isUpdate
            ? `Updating ${snapshot.studentName}…`
            : `Saving ${snapshot.studentName}…`,
          onSuccess: () => {
            if (isUpdate) {
              //  setRecords((p) =>  p.map((r) => (r.id === snapshot.id ? snapshot : r)),  );
            } else {
              // setRecords((p) => [...p, { ...snapshot, id: Date.now() }]);
            }
          },
          onError: (error) => {
            SwalError(
              error.response?.data?.title ||
                error.message ||
                "Failed to save record",
            );
          },
        },
      );
    } catch (error) {
      // Handle validation errors (step 1 errors)
      if (error.response?.data?.errors) {
        const msgs = Object.entries(error.response.data.errors)
          .map(([f, m]) => `• ${f.replace(/([A-Z])/g, " $1").trim()}: ${m[0]}`)
          .join("\n");
        SwalError(`Validation Failed:\n\n${msgs}`);
      } else {
        SwalError(error.response?.data?.title || error.message || "Failed");
      }
    }
  };

  const handleView = (record) => {
    setViewModalRecord(record);
  };

  const handleEdit = async (record) => {
    let existingAttachments = [];

    try {
      const files = await getRecordAttachments(
        record.recordNo,
        record.studentId,
      );
      existingAttachments = (files ?? []).map((att) => ({
        file: null, // no File object for existing
        preview: att.downloadUrl, // ✅ use downloadUrl as preview
        name: att.fileName,
        size: att.fileSize ?? att.size ?? 0,
        downloadUrl: att.downloadUrl, // keep original too
        id: att.id,
        isExisting: true, // flag so you can skip re-uploading
      }));

      setForm({
        ...record,
        attachments: existingAttachments, // ✅ normalized shape
        recordNo: parseInt(record.recordNo, 10), // ensure recordNo is included
      });

      setIdInput(String(record.studentId ?? ""));
      setLookupState("found");
      setIsEditing(true);
      setTab("create");
    } catch (error) {
      // Handle validation errors (step 1 errors)
      if (error.response?.data?.errors) {
        const msgs = Object.entries(error.response.data.errors)
          .map(([f, m]) => `• ${f.replace(/([A-Z])/g, " $1").trim()}: ${m[0]}`)
          .join("\n");
        SwalError(`Validation Failed:\n\n${msgs}`);
      } else {
        SwalError(error.response?.data?.title || error.message || "Failed");
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this record?"))
      setRecords((p) => p.filter((r) => r.id !== id));
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStaffFilter("");
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const searchText = search?.toLowerCase().trim();
  const staffText = staffFilter?.toLowerCase().trim();

  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;

  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  const filtered = records.filter((record) => {
    const visitDate = new Date(record.visitDate);

    const matchesSearch =
      !searchText ||
      record.studentName?.toLowerCase().includes(searchText) ||
      record.nal?.toLowerCase().includes(searchText);

    const matchesFrom = !fromDate || visitDate >= fromDate;
    const matchesTo = !toDate || visitDate <= toDate;

    const matchesStaff =
      !staffText || record.nurseAttendant?.toLowerCase().includes(staffText);

    return matchesSearch && matchesFrom && matchesTo && matchesStaff;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal =
      sortField === "dateTime"
        ? new Date(a[sortField]).getTime()
        : String(a[sortField] || "").toLowerCase();
    let bVal =
      sortField === "dateTime"
        ? new Date(b[sortField]).getTime()
        : String(b[sortField] || "").toLowerCase();
    return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const paginatedRecords = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const LookupBadge = () => {
    if (lookupState === "loading")
      return (
        <span className="flex items-center gap-1 text-[11px] text-slate-600">
          <i className="fa-solid fa-spinner fa-spin" /> Searching…
        </span>
      );
    if (lookupState === "found")
      return (
        <span className="flex items-center gap-1 text-[11px] text-teal-500 font-semibold">
          <i className="fa-solid fa-circle-check" /> Student found
        </span>
      );
    if (lookupState === "error")
      return (
        <span className="flex items-center gap-1 text-[11px] text-rose-500">
          <i className="fa-solid fa-circle-xmark" /> {lookupError}
        </span>
      );
    return null;
  };

  const getStudentInfo = async (studentId) => {
    // Check cache first
    if (studentCache[studentId]) {
      return studentCache[studentId];
    }

    // Fetch from API
    try {
      const data = await getStudentByStudentIDNo(studentId);

      setStudentCache((prev) => ({ ...prev, [studentId]: data }));
      return data;
    } catch (error) {
      console.error("Failed to load student:", error);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ViewModal Component
  // ─────────────────────────────────────────────────────────────
  const ViewModal = ({ record, onClose, onEdit, canEdit, getStudentInfo }) => {
    const [studentData, setStudentData] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);

    useEffect(() => {
      if (record) {
        loadStudentData();
        loadAttachments();
      }
    }, [record]);

    const loadStudentData = async () => {
      try {
        setLoading(true);
        const data = await getStudentInfo(record.studentId); // Uses cache
        setStudentData(data);
      } catch (error) {
        console.error("Failed to load student data:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadAttachments = async () => {
      try {
        setAttachmentsLoading(true);
        //console.log( "Loading attachments for record:",record.recordNo, " ", record.studentId,);
        const files = await getRecordAttachments(
          record.recordNo,
          record.studentId,
        );
        setAttachments(files);
      } catch (error) {
        console.error("Failed to load attachments:", error);
      } finally {
        setAttachmentsLoading(false);
      }
    };

    if (!record) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl overflow-hidden bg-white shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-br from-teal-400 to-teal-600">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full">
                <i className="text-teal-600 fa-solid fa-file-medical" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Clinic Record Details
                </h2>
                <p className="text-xs text-teal-50">
                  Record No: {record.recordNo}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full hover:bg-white/20"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
                <p className="ml-3 text-sm text-slate-600">
                  Loading student information...
                </p>
              </div>
            ) : (
              <>
                {/* Student Info */}
                <div className="flex items-start gap-6 pb-6 mb-6 border-b border-slate-200">
                  <div className="flex-shrink-0 w-24 h-24 overflow-hidden border-4 border-white rounded-full shadow-lg bg-slate-100">
                    {studentData?.photoUrl ? (
                      <img
                        src={studentData.photoUrl}
                        alt={studentData.studentName}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-slate-300">
                        <i className="text-4xl fa-solid fa-user" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800">
                      {studentData?.studentName}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                          Student ID
                        </p>
                        <p className="mt-1 font-mono text-sm font-medium text-slate-800">
                          {record.studentId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                          Grade & Class
                        </p>
                        <p className="mt-1 text-sm text-slate-800">
                          {studentData?.classDept}: {studentData?.groupLevel} -{" "}
                          {studentData?.class}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                          Gender
                        </p>
                        <p className="mt-1 text-sm text-slate-800">
                          {studentData?.gender || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                          Nationality
                        </p>
                        <p className="mt-1 text-sm text-slate-800">
                          {studentData?.nationality || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinic Details */}
                <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                      Visit Date & Time
                    </p>
                    <p className="text-sm text-slate-800">
                      {fmtDate(record.visitDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                      Attended By
                    </p>
                    <p className="text-sm text-slate-800">
                      {record.nurseAttendant}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                      NAL – Nature of Accident / Illness
                    </p>
                    <p className="text-sm leading-relaxed text-slate-800">
                      {record.nal}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                      Condition Required for First Aid
                    </p>
                    <p className="text-sm leading-relaxed text-slate-800">
                      {record.condition}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                      Action Taken
                    </p>
                    <p className="text-sm leading-relaxed text-slate-800">
                      {record.actionTaken}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                <div className="pt-6 mt-6 border-t border-slate-200">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600 mb-3">
                    Attachments
                  </p>

                  {attachmentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fa-solid fa-spinner fa-spin" />
                      Loading attachments...
                    </div>
                  ) : attachments?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {attachments.map((att) => (
                        <a
                          key={att.id ?? att.fileName}
                          href={att.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={att.downloadUrl}
                            alt={att.fileName}
                            className="object-cover transition-opacity border rounded-lg w-28 h-28 border-slate-200 group-hover:opacity-75"
                          />

                          <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-lg opacity-0 bg-black/50 group-hover:opacity-100">
                            <i className="text-2xl text-white fa-solid fa-download" />
                          </div>

                          <p className="text-[9px] text-slate-500 text-center mt-1 truncate max-w-[112px]">
                            {att.fileName}
                          </p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No attachments</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t bg-slate-50 border-slate-200">
            {canEdit && (
              <button
                onClick={() => {
                  onEdit(record);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-teal-500 hover:bg-teal-600 rounded-xl"
              >
                <i className="fa-solid fa-pen" />
                Edit Record
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`body, * { font-family: 'DM Sans', sans-serif; } .mono { font-family: 'DM Mono', monospace; }`}</style>

      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-teal-500 shadow-sm w-9 h-9 rounded-xl">
              <i className="text-white fa-solid fa-kit-medical" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-slate-800">
                Clinic Records
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Health Management System
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs rounded-full mono bg-slate-100 text-slate-700">
            {records.length} {records.length === 1 ? "record" : "records"}
          </span>
        </header>

        <div className="px-4 py-8 mx-auto max-w-7xl">
          <div className="flex gap-8 mb-8 border-b border-slate-200">
            {canCreate && (
              <button
                onClick={() => setTab("create")}
                className={`pb-3 text-sm font-semibold relative transition-colors ${tab === "create" ? "text-teal-600" : "text-slate-400 hover:text-slate-800"}`}
              >
                <i className="mr-2 fa-solid fa-plus" />
                {isEditing ? "Edit Record" : "Create Record"}
                {tab === "create" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
                )}
              </button>
            )}
            {canView && (
              <button
                onClick={() => setTab("records")}
                className={`pb-3 text-sm font-semibold relative transition-colors ${tab === "records" ? "text-teal-600" : "text-slate-400 hover:text-slate-800"}`}
              >
                <i className="mr-2 fa-solid fa-list" />
                Record List
                {tab === "records" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
                )}
              </button>
            )}
          </div>

          {tab === "create" && canCreate && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="flex flex-col gap-5 lg:col-span-1">
                  <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-100">
                    <div className="relative flex items-end justify-center h-24 pb-0 bg-gradient-to-br from-teal-400 to-teal-600">
                      <div className="absolute w-20 h-20 overflow-hidden border-4 border-white rounded-full shadow-lg -bottom-10 bg-slate-100">
                        {form.photoUrl && lookupState === "found" ? (
                          <img
                            src={form.photoUrl}
                            alt={form.studentName}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full text-slate-300">
                            <i
                              className={`fa-solid ${lookupState === "loading" ? "fa-spinner fa-spin text-teal-300" : "fa-user"} text-3xl`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-5 pt-12 pb-4 text-center border-b border-slate-50">
                      {lookupState === "found" ? (
                        <>
                          <p className="text-base font-bold leading-tight text-slate-800">
                            {form.studentName}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {form.grade}
                            {form.section ? ` · ${form.section}` : ""}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm italic text-slate-400">
                          Enter ID to load student
                        </p>
                      )}
                    </div>
                    <div className="px-5 py-4">
                      <Label required>Student ID Number</Label>
                      <div className="relative mt-1">
                        <input
                          value={idInput}
                          onChange={(e) => setIdInput(e.target.value)}
                          disabled={isEditing}
                          maxLength={5}
                          placeholder="e.g. 24123"
                          className="w-full py-2 pr-6 text-sm transition-colors bg-transparent border-b-2 outline-none mono border-slate-200 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
                        />
                        {lookupState === "loading" && (
                          <i className="fa-solid fa-spinner fa-spin absolute right-0 top-2.5 text-slate-300 text-xs" />
                        )}
                        {lookupState === "found" && (
                          <i className="fa-solid fa-circle-check absolute right-0 top-2.5 text-teal-400 text-xs" />
                        )}
                        {lookupState === "error" && (
                          <i className="fa-solid fa-circle-xmark absolute right-0 top-2.5 text-rose-400 text-xs" />
                        )}
                      </div>
                      <div className="mt-1.5 h-4">
                        <LookupBadge />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-5 bg-white border shadow-sm rounded-2xl border-slate-100">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-600">
                      Auto-filled Info{" "}
                      <i className="ml-1 fa-solid fa-lock text-slate-300" />
                    </p>
                    <ReadField
                      label="Grade & Class"
                      value={
                        form.classDept && form.groupLevel && form.class
                          ? `${form.classDept}: ${form.groupLevel} - ${form.class}`
                          : "—"
                      }
                    />
                    <ReadField
                      label="Birth Date"
                      value={
                        form.birthDate
                          ? new Date(form.birthDate)
                              .toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              })
                              .replace(",", "")
                          : "—"
                      }
                    />
                    <ReadField
                      label="Nationality"
                      value={form.nationality}
                      placeholder="—"
                    />
                    <ReadField
                      label="Gender"
                      value={form.gender}
                      placeholder="—"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-5 lg:col-span-2">
                  <div className="flex flex-col gap-5 p-5 bg-white border shadow-sm rounded-2xl border-slate-100">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-600">
                      Clinic Details
                    </p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <EditInput
                        label="Date & Time"
                        required
                        type="datetime-local"
                        name="visitDate"
                        value={form.visitDate}
                        onChange={handleChange}
                      />
                      <EditInput
                        label="Attended By"
                        required
                        name="nurseAttendant"
                        value={form.nurseAttendant}
                        onChange={handleChange}
                        placeholder="Nurse / staff name"
                      />
                    </div>
                    <EditTextarea
                      label="NAL – Nature of Accident / Illness"
                      required
                      maxLength={250}
                      name="nal"
                      value={form.nal}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the nature of the accident or illness…"
                    />
                    <EditTextarea
                      label="Condition Required for First Aid"
                      required
                      maxLength={250}
                      name="condition"
                      value={form.condition}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the condition and first-aid requirements…"
                    />
                    <EditTextarea
                      label="Action Taken"
                      required
                      maxLength={250}
                      name="actionTaken"
                      value={form.actionTaken}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe all actions and treatment provided…"
                    />
                  </div>

                  <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-100">
                    <Attachments
                      files={form.attachments}
                      onChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          attachments: v,
                          fileSize: v.reduce((s, f) => s + (f.size || 0), 0),
                        }))
                      }
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!isEditing && lookupState !== "found"}
                      className="flex items-center justify-center flex-1 gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors bg-teal-500 hover:bg-teal-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed rounded-xl"
                    >
                      <i className="fa-solid fa-floppy-disk" />
                      {isEditing ? "Update Record" : "Save Record"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        if (isEditing) setTab("records");
                      }}
                      className="px-5 py-3 text-sm font-semibold transition-colors bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>

                  {!isEditing && lookupState !== "found" && (
                    <p className="text-xs text-center text-slate-500">
                      <i className="mr-1 fa-solid fa-circle-info" />
                      Enter a valid Student ID on the left to enable saving.
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}

          {tab === "records" && canView && (
            <div className="flex flex-col gap-5">
              <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-600">
                    <i className="fa-solid fa-filter mr-1.5" />
                    Filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-teal-500 hover:text-teal-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <i className="absolute text-xs -translate-y-1/2 fa-solid fa-magnifying-glass left-3 top-1/2 text-slate-300" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name, ID, NAL…"
                      className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:border-teal-400 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:border-teal-400 text-slate-800"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:border-teal-400 text-slate-800"
                  />
                  <input
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    placeholder="Attended by…"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:border-teal-400 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-600">
                    Showing{" "}
                    <strong className="text-slate-800">
                      {paginatedRecords.length}
                    </strong>{" "}
                    of {sorted.length} records
                  </p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 text-xs border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:border-teal-400 text-slate-800"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>

              {recordsLoading && lookupState ? (
                <div className="flex items-center justify-center p-16 bg-white border rounded-2xl border-slate-100">
                  <i className="text-3xl text-teal-400 fa-solid fa-spinner fa-spin" />
                  <p className="ml-3 text-sm text-slate-600">
                    Loading records...
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center bg-white border rounded-2xl border-slate-100">
                  <i className="block mb-3 text-4xl fa-solid fa-folder-open text-slate-200" />
                  <p className="text-sm font-medium text-slate-600">
                    {records.length === 0
                      ? "No records yet"
                      : "No records match your filters"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {records.length === 0
                      ? "Switch to Create Record to add the first entry"
                      : "Try adjusting the filters above"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto bg-white border shadow-sm rounded-2xl border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                          {[
                            { key: "studentName", label: "Student Name" },
                            { key: "studentId", label: "Student ID" },
                            { key: "visitDate", label: "Date & Time" },
                          ].map(({ key, label }) => (
                            <th
                              key={key}
                              onClick={() => handleSort(key)}
                              className="px-4 py-3 text-left transition-colors cursor-pointer hover:bg-slate-100"
                            >
                              <div className="flex items-center gap-2 font-semibold text-slate-700">
                                {label}
                                <i
                                  className={`fa-solid text-xs ${sortField === key ? (sortOrder === "asc" ? "fa-sort-up text-teal-500" : "fa-sort-down text-teal-500") : "fa-sort text-slate-300"}`}
                                />
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 font-semibold text-left text-slate-700">
                            NAL
                          </th>
                          <th
                            onClick={() => handleSort("nurseAttendant")}
                            className="px-4 py-3 text-left transition-colors cursor-pointer hover:bg-slate-100"
                          >
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              Attended By
                              <i
                                className={`fa-solid text-xs ${sortField === "nurseAttendant" ? (sortOrder === "asc" ? "fa-sort-up text-teal-500" : "fa-sort-down text-teal-500") : "fa-sort text-slate-300"}`}
                              />
                            </div>
                          </th>
                          <th className="px-4 py-3 font-semibold text-center text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecords.map((record, idx) => (
                          <tr
                            key={record.recordNo}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {record.studentName}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                              {record.studentId}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {fmtDate(record.visitDate)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <div className="max-w-xs truncate">
                                {record.nal}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {record.nurseAttendant}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {canView && (
                                  <button
                                    onClick={() => handleView(record)}
                                    title="View"
                                    className="flex items-center justify-center w-8 h-8 text-xs text-teal-500 transition-colors rounded-lg bg-teal-50 hover:bg-teal-100"
                                  >
                                    <i className="fa-solid fa-eye" />
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    onClick={() => handleEdit(record)}
                                    title="Edit"
                                    className="flex items-center justify-center w-8 h-8 text-xs text-teal-500 transition-colors rounded-lg bg-teal-50 hover:bg-teal-100"
                                  >
                                    <i className="fa-solid fa-pen" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    title="Delete"
                                    className="flex items-center justify-center w-8 h-8 text-xs transition-colors rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-400"
                                  >
                                    <i className="fa-solid fa-trash" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-white border shadow-sm rounded-2xl border-slate-100">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-chevron-left" /> Previous
                      </button>
                      <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          if (
                            totalPages <= 7 ||
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 text-sm font-medium transition-colors rounded-lg ${currentPage === page ? "bg-teal-500 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="flex items-center px-2 text-slate-400"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ View Modal */}
      <ViewModal
        record={viewModalRecord}
        onClose={() => setViewModalRecord(null)}
        onEdit={handleEdit}
        canEdit={canEdit}
        getStudentInfo={getStudentInfo}
      />

      {/* Floating task spinner — auto-shows/hides based on tasks */}
      <TaskToast tasks={tasks} />
    </>
  );
};

export default Clinic;

// ─────────────────────────────────────────────────────────────
// USAGE EXAMPLES — how to use useAsyncTask in any component
// ─────────────────────────────────────────────────────────────
//
// Step 1: import the hook and component
//   import { useAsyncTask, TaskToast } from "./Clinic";
//   // (or move them to src/hooks/useAsyncTask.js for shared use)
//
// Step 2: call the hook
//   const { run, tasks } = useAsyncTask();
//
// Step 3: call run() with any async function + a label
//   run(() => createRecordValidation(form), {
//     label: "Saving John Doe…",
//   });
//
// Step 4: mount TaskToast anywhere in your JSX
//   <TaskToast tasks={tasks} />
//
//
// ── More examples ─────────────────────────────────────────────
//
// With success/error callbacks:
//   run(() => uploadFileToOneDrive(file), {
//     label: "Uploading to OneDrive…",
//     onSuccess: (result) => console.log("Done!", result),
//     onError:   (error)  => SwalError(error.message),
//   });
//
// Update record:
//   run(() => updateRecordValidation(form), {
//     label: `Updating ${form.studentName}…`,
//     onSuccess: () => setRecords((p) => p.map((r) => r.id === form.id ? form : r)),
//   });
//
// Multiple concurrent tasks (each gets its own spinner row):
//   run(() => createRecordValidation(form1), { label: "Saving Juan…" });
//   run(() => createRecordValidation(form2), { label: "Saving Maria…" });
//   // Both show simultaneously in the panel ✓
//
// ─────────────────────────────────────────────────────────────
