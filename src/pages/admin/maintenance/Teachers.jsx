import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  getTeachersList,
  createTeacherValidation,
  createTeacher,
  updateTeacherValidation,
  updateTeacher,
  getTeachersReferences,
} from "../../../API/Teachers";
import AuthContext from "../../../contexts/AuthContext";

// ─── Permission Hook ───────────────────────────────────────────────────────
const usePermissions = () => {
  const { userMenus, loading } = useContext(AuthContext);

  const hasPermission = (menuName, action) => {
    if (!userMenus || userMenus.length === 0) return false;
    const menu = userMenus.find((m) => m.menuName === menuName);
    if (menu) {
      if (menu[action] !== undefined) return menu[action];
      if (menu.subMenus && menu.subMenus.length > 0) {
        const subMatch = menu.subMenus.find((sub) => sub.menuName === menuName);
        if (subMatch && subMatch[action] !== undefined) return subMatch[action];
        return menu.subMenus.some((sub) => sub[action] === true);
      }
    }
    for (const m of userMenus) {
      if (m.subMenus && m.subMenus.length > 0) {
        const sub = m.subMenus.find((s) => s.menuName === menuName);
        if (sub && sub[action] !== undefined) return sub[action];
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
              <i
                className="fa-solid fa-spinner spin-ring text-teal-500 flex-shrink-0"
                style={{ fontSize: 16 }}
              />
            )}
            {task.status === "done" && (
              <i
                className="fa-solid fa-circle-check text-emerald-500 flex-shrink-0"
                style={{ fontSize: 16 }}
              />
            )}
            {task.status === "error" && (
              <i
                className="fa-solid fa-circle-xmark text-red-500 flex-shrink-0"
                style={{ fontSize: 16 }}
              />
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
          : "w-16 h-16 text-lg"; // xl

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

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ isActive }) =>
  isActive ? (
    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
      <i className="fa-solid fa-circle" style={{ fontSize: 6 }} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
      <i className="fa-solid fa-circle" style={{ fontSize: 6 }} />
      Inactive
    </span>
  );

// ─── Field Error ───────────────────────────────────────────────────────────
const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null;

// ─── Validate Teacher Form ─────────────────────────────────────────────────
const validateTeacherForm = (form) => {
  const errors = {};
  if (!form.empName?.trim()) errors.empName = "Name is required.";
  if (!form.position?.trim()) errors.position = "Position is required.";
  if (!form.department?.trim()) errors.department = "Department is required.";
  if (!form.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.joinedDate) errors.joinedDate = "Joined date is required.";
  return errors;
};

// ─── Create / Edit Modal ───────────────────────────────────────────────────
const TeacherFormModal = ({
  mode, // "create" | "edit"
  initial,
  references,
  onClose,
  onSaved,
  addTask,
  updateTask,
}) => {
  const isEdit = mode === "edit";
  const taskIdRef = useRef(0);

  const emptyForm = {
    empID: "",
    empName: "",
    position: "",
    department: "",
    email: "",
    joinedDate: "",
    isActive: true,
    photo: null, // File object
  };

  const [form, setForm] = useState(
    isEdit && initial
      ? {
          empID: initial.empID ?? "",
          empName: initial.empName ?? "",
          position: initial.position ?? "",
          department: initial.department ?? "",
          email: initial.email ?? "",
          joinedDate: initial.joinedDate
            ? initial.joinedDate.split("T")[0]
            : "",
          isActive: initial.isActive ?? true,
          photo: null,
        }
      : emptyForm,
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl ?? null);

  const update = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, photo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const validationErrors = validateTeacherForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    const id = ++taskIdRef.current;
    const label = isEdit
      ? `Updating ${form.empName}…`
      : `Creating ${form.empName}…`;
    addTask({ id, label, status: "loading" });

    try {
      if (isEdit) {
        // Pre-save validation
        await updateTeacherValidation({ empID: form.empID, email: form.email });
        await updateTeacher({ ...form });
        updateTask(id, { status: "done", label: `${form.empName} updated` });
      } else {
        // Pre-save validation
        await createTeacherValidation({ email: form.email });
        await createTeacher({ ...form });
        updateTask(id, { status: "done", label: `${form.empName} created` });
      }

      setTimeout(() => updateTask(id, null), 3000);
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err.message ?? "Operation failed.";
      updateTask(id, {
        status: "error",
        label: `Failed – ${form.empName}`,
        errorMsg: msg,
      });
      setSubmitError(msg);
      setTimeout(() => updateTask(id, null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i
              className={`fa-solid ${isEdit ? "fa-pen-to-square" : "fa-user-plus"} text-teal-600`}
            />
            <p className="text-sm font-semibold text-slate-800">
              {isEdit ? "Edit Teacher" : "Add New Teacher"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={submitting}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-teal-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-dashed border-teal-300 flex items-center justify-center">
                  <i className="fa-solid fa-user text-teal-400 text-xl" />
                </div>
              )}
              <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                <i className="fa-solid fa-camera text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={submitting}
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">
                {photoPreview ? "Change Photo" : "Attach Photo"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click the circle to upload. JPG, PNG supported.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Name */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.empName}
                onChange={(e) => update("empName", e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                  errors.empName ? "border-red-300" : "border-slate-200"
                }`}
              />
              <FieldError msg={errors.empName} />
            </div>

            {/* Position */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Position <span className="text-red-400">*</span>
              </label>
              <select
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                  errors.position ? "border-red-300" : "border-slate-200"
                }`}
              >
                <option value="">Select position…</option>
                {(references?.positions ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.position} />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                  errors.department ? "border-red-300" : "border-slate-200"
                }`}
              >
                <option value="">Select department…</option>
                {(references?.departments ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.department} />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="e.g. juan.delacruz@aus.edu"
                disabled={submitting || isEdit}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                  errors.email ? "border-red-300" : "border-slate-200"
                } ${isEdit ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50"}`}
              />
              {isEdit && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Email cannot be changed after creation.
                </p>
              )}
              <FieldError msg={errors.email} />
            </div>

            {/* Joined Date */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Joined Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.joinedDate}
                onChange={(e) => update("joinedDate", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                  errors.joinedDate ? "border-red-300" : "border-slate-200"
                }`}
              />
              <FieldError msg={errors.joinedDate} />
            </div>

            {/* Status (edit only) */}
            {isEdit && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Status
                </label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    update("isActive", e.target.value === "active")
                  }
                  disabled={submitting}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Resigned</option>
                </select>
                {!form.isActive && (
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    <i className="fa-solid fa-triangle-exclamation mr-1" />
                    Marking as inactive will deactivate this teacher.
                  </p>
                )}
              </div>
            )}
          </div>

          {submitError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <i className="fa-solid fa-circle-exclamation mr-1.5" />
              {submitError}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner spin-ring" />
                {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <i
                  className={`fa-solid ${isEdit ? "fa-floppy-disk" : "fa-plus"}`}
                />
                {isEdit ? "Save Changes" : "Create Teacher"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Deactivate Confirm Modal ──────────────────────────────────────────────
const DeactivateModal = ({ teacher, onClose, onConfirm, submitting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <i className="fa-solid fa-user-slash text-amber-500 text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Mark as Resigned / Inactive?
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          You are about to mark{" "}
          <span className="font-semibold text-slate-700">
            {teacher?.empName}
          </span>{" "}
          as{" "}
          <span className="text-rose-500 font-semibold">
            Inactive / Resigned
          </span>
          . This action can be reversed by editing the record.
        </p>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <i className="fa-solid fa-spinner spin-ring" />
          ) : (
            <i className="fa-solid fa-user-slash" />
          )}
          {submitting ? "Processing…" : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

// ─── View Tab ──────────────────────────────────────────────────────────────
const ViewTab = ({
  teachers,
  loading,
  references,
  canUpdate,
  addTask,
  updateTask,
  onRefresh,
}) => {
  const [filterText, setFilterText] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const taskIdRef = useRef(0);

  const filtered = useMemo(() => {
    const t = filterText.toLowerCase();
    return (teachers ?? []).filter((emp) => {
      const matchText =
        !t ||
        emp.empName?.toLowerCase().includes(t) ||
        String(emp.empID).includes(t) ||
        emp.email?.toLowerCase().includes(t);
      const matchDept = !filterDept || emp.department === filterDept;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && emp.isActive) ||
        (filterStatus === "inactive" && !emp.isActive);
      return matchText && matchDept && matchStatus;
    });
  }, [teachers, filterText, filterDept, filterStatus]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    const id = ++taskIdRef.current;
    addTask({
      id,
      label: `Deactivating ${deactivateTarget.empName}…`,
      status: "loading",
    });
    try {
      await updateTeacherValidation({
        empID: deactivateTarget.empID,
        email: deactivateTarget.email,
      });
      await updateTeacher({ ...deactivateTarget, isActive: false });
      updateTask(id, {
        status: "done",
        label: `${deactivateTarget.empName} marked inactive`,
      });
      setTimeout(() => updateTask(id, null), 3000);
      onRefresh();
      setDeactivateTarget(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err.message ?? "Operation failed.";
      updateTask(id, {
        status: "error",
        label: `Failed – ${deactivateTarget.empName}`,
        errorMsg: msg,
      });
      setTimeout(() => updateTask(id, null), 5000);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-4 md:p-6 flex flex-col gap-5">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Filter
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Search by name, ID, or email…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">All Departments</option>
                  {(references?.departments ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive / Resigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-teal-400" />
              <span className="text-sm text-slate-500">Loading teachers…</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Teachers
                </p>
                <span className="text-xs text-slate-400">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <i className="fa-solid fa-users-slash text-3xl text-slate-300 mb-3" />
                  <p className="text-sm text-slate-400">
                    No teachers match your filter.
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
                          Emp ID
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Name
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Position
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Department
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Email
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          Status
                        </th>
                        {canUpdate && (
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((emp) => (
                        <tr
                          key={emp.empID}
                          className={`hover:bg-slate-50 transition-colors ${!emp.isActive ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <Avatar
                              name={emp.empName}
                              photoUrl={emp.photoUrl}
                              size="md"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                            {emp.empID}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                            {emp.empName}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {emp.position ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {emp.department ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {emp.email ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {emp.joinedDate
                              ? new Date(emp.joinedDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge isActive={emp.isActive} />
                          </td>
                          {canUpdate && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setEditTarget(emp)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 border border-teal-200 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <i className="fa-solid fa-pen-to-square" />
                                  Edit
                                </button>
                                {emp.isActive && (
                                  <button
                                    onClick={() => setDeactivateTarget(emp)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                    title="Mark as Resigned"
                                  >
                                    <i className="fa-solid fa-user-slash" />
                                    Resign
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <TeacherFormModal
          mode="edit"
          initial={editTarget}
          references={references}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            onRefresh();
          }}
          addTask={addTask}
          updateTask={updateTask}
        />
      )}

      {/* Deactivate Confirm */}
      {deactivateTarget && (
        <DeactivateModal
          teacher={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivate}
          submitting={deactivating}
        />
      )}
    </div>
  );
};

// ─── Create Tab ────────────────────────────────────────────────────────────
const CreateTab = ({ references, addTask, updateTask, onRefresh }) => (
  <TeacherFormModal
    mode="create"
    initial={null}
    references={references}
    onClose={() => {}} // no-op; page doesn't unmount
    onSaved={onRefresh}
    addTask={addTask}
    updateTask={updateTask}
    inline // flag to render as page section, not modal
  />
);

// ─── Inline Create Section (wraps modal as inline card) ───────────────────
const CreateSection = ({ references, addTask, updateTask, onRefresh }) => {
  const taskIdRef = useRef(0);
  const emptyForm = {
    empName: "",
    position: "",
    department: "",
    email: "",
    joinedDate: "",
    isActive: true,
    photo: null,
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  const update = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, photo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setForm(emptyForm);
    setErrors({});
    setSubmitError("");
    setSubmitSuccess("");
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    const validationErrors = validateTeacherForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);
    const id = ++taskIdRef.current;
    addTask({ id, label: `Creating ${form.empName}…`, status: "loading" });

    try {
      await createTeacherValidation({ email: form.email });
      await createTeacher({ ...form });
      updateTask(id, { status: "done", label: `${form.empName} created` });
      setSubmitSuccess(`${form.empName} has been added successfully.`);
      setTimeout(() => updateTask(id, null), 3000);
      onRefresh();
      handleReset();
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err.message ?? "Operation failed.";
      updateTask(id, {
        status: "error",
        label: `Failed – ${form.empName}`,
        errorMsg: msg,
      });
      setSubmitError(msg);
      setTimeout(() => updateTask(id, null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm flex flex-col gap-5 max-w-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Teacher Information
          </p>

          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-teal-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-dashed border-teal-300 flex items-center justify-center">
                  <i className="fa-solid fa-user text-teal-400 text-xl" />
                </div>
              )}
              <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                <i className="fa-solid fa-camera text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={submitting}
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">
                {photoPreview ? "Change Photo" : "Attach Photo"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click the circle to upload. JPG, PNG supported.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.empName}
                onChange={(e) => update("empName", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="e.g. Juan dela Cruz"
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.empName ? "border-red-300" : "border-slate-200"}`}
              />
              <FieldError msg={errors.empName} />
            </div>

            {/* Position */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Position <span className="text-red-400">*</span>
              </label>
              <select
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.position ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Select position…</option>
                {(references?.positions ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.position} />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.department ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Select department…</option>
                {(references?.departments ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.department} />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="e.g. juan.delacruz@aus.edu"
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.email ? "border-red-300" : "border-slate-200"}`}
              />
              <FieldError msg={errors.email} />
            </div>

            {/* Joined Date */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Joined Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.joinedDate}
                onChange={(e) => update("joinedDate", e.target.value)}
                disabled={submitting}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.joinedDate ? "border-red-300" : "border-slate-200"}`}
              />
              <FieldError msg={errors.joinedDate} />
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <i className="fa-solid fa-circle-exclamation mr-1.5" />
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
              <i className="fa-solid fa-circle-check mr-1.5" />
              {submitSuccess}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 disabled:opacity-60 active:scale-95 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner spin-ring" />
                  Creating…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus" />
                  Create Teacher
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={submitting}
              className="flex-none bg-slate-100 hover:bg-slate-200 disabled:opacity-60 active:scale-95 text-slate-600 font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-left" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const Teachers = () => {
  const { hasPermission, loading } = usePermissions();

  const canCreate = hasPermission("Teachers", "canCreate");
  const canView = hasPermission("Teachers", "canView");
  const canUpdate = hasPermission("Teachers", "canUpdate");

  const [references, setReferences] = useState({
    positions: [],
    departments: [],
  });
  const [teachers, setTeachers] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [refsError, setRefsError] = useState("");
  const [activeTab, setActiveTab] = useState("view");
  const [tasks, setTasks] = useState([]);

  // ── Load references on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!canView && !canCreate) return;
    const load = async () => {
      try {
        const refs = await getTeachersReferences();
        setReferences(refs ?? { positions: [], departments: [] });
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

  // ── Load teachers list ────────────────────────────────────────────────
  const loadTeachers = useCallback(async () => {
    if (!canView) return;
    setTeachersLoading(true);
    try {
      const data = await getTeachersList();
      setTeachers(data ?? []);
    } catch (e) {
      console.error("Failed to load teachers:", e);
    } finally {
      setTeachersLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // ── Default tab ───────────────────────────────────────────────────────
  useEffect(() => {
    if (canCreate) setActiveTab("create");
    if (canView) setActiveTab("view");
    if (canCreate && canView) setActiveTab("view");
  }, [canCreate, canView]);

  const addTask = useCallback((task) => setTasks((p) => [...p, task]), []);
  const updateTask = useCallback((id, patch) => {
    if (patch === null) setTasks((p) => p.filter((t) => t.id !== id));
    else setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  // ── Guards ────────────────────────────────────────────────────────────
  if (loading || refsLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-teal-400" />
      </div>
    );

  if (!canCreate && !canView)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50">
        <i className="fa-solid fa-lock text-5xl text-rose-400" />
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
                  Teachers
                </h1>
                <p className="text-teal-300 text-sm mt-0.5 mb-4">
                  Manage teacher records and employment status
                </p>
              </div>
              {canView && (
                <div className="pb-4">
                  <button
                    onClick={loadTeachers}
                    disabled={teachersLoading}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-200 hover:text-white border border-teal-500 hover:border-teal-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <i
                      className={`fa-solid fa-rotate-right ${teachersLoading ? "fa-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>
              )}
            </div>

            {showBothTabs && (
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("view")}
                  className={`flex-1 md:flex-none md:min-w-[180px] flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "view"
                      ? "border-white text-white"
                      : "border-transparent text-teal-300 hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-users" />
                  View Teachers
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 md:flex-none md:min-w-[180px] flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "create"
                      ? "border-white text-white"
                      : "border-transparent text-teal-300 hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-user-plus" />
                  Add Teacher
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Shell */}
        <div className="px-0 md:px-4 lg:px-6 py-0 md:py-6">
          <div className="bg-transparent md:bg-white md:border md:border-slate-200 md:rounded-3xl md:shadow-sm overflow-hidden min-h-[calc(100vh-180px)]">
            <div className="flex flex-col flex-1 overflow-hidden">
              {activeTab === "view" && canView && (
                <ViewTab
                  teachers={teachers}
                  loading={teachersLoading}
                  references={references}
                  canUpdate={canUpdate}
                  addTask={addTask}
                  updateTask={updateTask}
                  onRefresh={loadTeachers}
                />
              )}
              {activeTab === "create" && canCreate && (
                <CreateSection
                  references={references}
                  addTask={addTask}
                  updateTask={updateTask}
                  onRefresh={loadTeachers}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskToast tasks={tasks} />
    </div>
  );
};

export default Teachers;
