import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getReferenceLists } from "../../../API/ReferencesAPI";
import {
  createTicket,
  getTicketListByUserID,
  getTicketNotificationListByUser,
  markNotificationAsRead,
} from "../../../API/TicketAPI";
import SkeletonLargeBoxes from "../../../components/skeletons/SkeletonLargeBoxes";
import {
  SwalSuccess,
  SwalError,
  ToastError,
  ToastInfo,
  SwalInfoDynamic,
} from "../../../utils/SwalAlert";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createNotificationConnection } from "../../../signalr/notificationConnection";

const ROWS_PER_PAGE = 15;

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Icon = ({ name, className = "" }) => (
  <i className={`fa-solid fa-${name} ${className}`} />
);

const BellIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const SendIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────
const StatCard = ({ label, value, bg, icon, loading }) => (
  <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm text-slate-600">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        )}
      </div>
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-lg ${bg}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const resolved = status === "Resolved";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        resolved
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${resolved ? "bg-green-500" : "bg-yellow-500"}`}
      />
      {status}
    </span>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const btnBase =
    "p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs";
  const delta = 2;
  const pages = [];
  for (
    let i = Math.max(1, currentPage - delta);
    i <= Math.min(totalPages, currentPage + delta);
    i++
  ) {
    pages.push(i);
  }
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-3 bg-white border-t border-slate-200">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={btnBase}
      >
        <Icon name="angles-left" className="text-[10px]" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={btnBase}
      >
        <Icon name="chevron-left" className="text-[10px]" />
      </button>
      {pages[0] > 1 && <span className="px-1 text-slate-400">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
            p === currentPage
              ? "bg-green-700 text-white"
              : "hover:bg-slate-100 text-slate-700"
          }`}
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
        <Icon name="chevron-right" className="text-[10px]" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={btnBase}
      >
        <Icon name="angles-right" className="text-[10px]" />
      </button>
    </div>
  );
};

const NotificationPanel = ({ notifications, onItemClick }) => (
  <div className="absolute right-0 z-50 w-80 mt-1 bg-white border rounded-lg shadow-xl border-slate-200 top-full overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
      <span className="text-sm font-semibold text-slate-800">
        Notifications
      </span>
      {notifications.filter((n) => !n.isRead).length > 0 && (
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          {notifications.filter((n) => !n.isRead).length} new
        </span>
      )}
    </div>
    {notifications.length === 0 ? (
      <div className="py-8 text-center text-slate-400 text-sm">
        <div className="flex justify-center mb-2">
          <BellIcon />
        </div>
        <p>No notifications yet</p>
      </div>
    ) : (
      <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
        {notifications.map((n) => (
          <li
            key={n.notificationID}
            onClick={() => onItemClick(n)}
            className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-blue-50/40" : ""}`}
          >
            {!n.isRead && (
              <span className="w-2 h-2 rounded-full bg-green-600 shrink-0 mt-1" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800">
                Ticket #AUS00{n.taskID}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {n.notificationMessage || n.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "file-pdf";
  if (["doc", "docx"].includes(ext)) return "file-word";
  if (["xls", "xlsx"].includes(ext)) return "file-excel";
  if (["zip", "rar"].includes(ext)) return "file-zipper";
  return "file-lines";
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TicketPage() {
  const { user, logout } = useAuth();
  const outletContext = useOutletContext();
  const setUnreadCount = outletContext?.setUnreadCount;

  const notifRef = useRef(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("create");
  const [refSuppCategory, setSupportCategories] = useState([]);
  const [refSupportMarking, setMarkings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true); // ✅ separate loading states
  const [ticketLoading, setTicketLoading] = useState(true); // ✅ tickets load independently
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supportStatus: "NW",
    supportCategory: "",
    refSupportMarking: "",
    description: "",
  });
  const [attachments, setAttachments] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "ticketIDNo",
    direction: "asc",
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Sync unread badge to sidebar ──────────────────────────────────────────
  useEffect(() => {
    if (setUnreadCount) setUnreadCount(unreadCount);
  }, [unreadCount]);

  // ── ✅ Load references on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const refs = await getReferenceLists();
        setSupportCategories(refs.refSuppCategory || []);
        setMarkings(refs.refSupportMarking || []);
      } catch {
        SwalError("Something went wrong", "Could not load references.");
      } finally {
        setRefsLoading(false);
      }
    };
    load();
  }, []);

  // ── ✅ Load tickets on mount — NOT gated by activeTab ────────────────────
  const fetchTickets = useCallback(async () => {
    setTicketLoading(true);
    try {
      const list = await getTicketListByUserID(user.empID);
      setTickets(list || []);
    } catch {
      SwalError("Failed to load tickets", "Please try again later.");
    } finally {
      setTicketLoading(false);
    }
  }, [user.empID]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]); // ✅ runs on mount immediately

  // ── Load notifications on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.empID) return;
    const loadNotifs = async () => {
      try {
        const data = (await getTicketNotificationListByUser()) || [];
        setNotifications(data);
        const byTicket = {};
        data
          .filter((n) => !n.isRead)
          .forEach((n) => {
            byTicket[n.taskID] = (byTicket[n.taskID] || 0) + 1;
          });
        Object.entries(byTicket).forEach(([id, count]) => {
          ToastInfo(`You have ${count} update(s) in Ticket #AUS00${id}`);
        });
      } catch {
        /* silent */
      }
    };
    loadNotifs();
  }, [user.empID]);

  // ── Click outside notification panel ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── SignalR ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.empID || !user?.token) return;
    const conn = createNotificationConnection(user.token);
    conn.on("ReceiveNotification", (notif) => {
      ToastInfo(notif.message);
      setNotifications((prev) => [{ ...notif, isRead: false }, ...prev]);
      // ✅ Also refresh ticket list when a notification comes in
      fetchTickets();
    });
    conn
      .start()
      .then(() => conn.invoke("JoinUser", user.empID))
      .catch((e) => console.error("SignalR:", e));
    return () => conn.stop();
  }, [user.empID, user.token, fetchTickets]);

  // ── Guard: logout if admin token ──────────────────────────────────────────
  useEffect(() => {
    if (user?.role?.toLowerCase() === "admin") logout();
  }, [user?.role]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNotifBell = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setShowNotifications((prev) => !prev);
    if (unreadCount > 0) await markNotificationAsRead();
  };

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    const ticket = tickets.find((t) => t.ticketIDNo === notif.taskID);
    if (ticket) viewTicket(ticket);
    else {
      // If ticket not loaded yet, switch to list tab
      setActiveTab("list");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
    const MAX_MB = 10;
    const valid = files.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (valid.length < files.length)
      ToastError(`Some files exceed ${MAX_MB} MB and were skipped.`);
    setAttachments((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))];
    });
    if (e.target) e.target.value = "";
  };

  const removeAttachment = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileChange(e);
  };

  const handleSubmit = async () => {
    if (
      !formData.supportCategory ||
      !formData.refSupportMarking ||
      !formData.description.trim()
    ) {
      ToastError("Please fill up all fields.");
      return;
    }
    const payload = {
      EmpID: user.empID,
      Email: user.email,
      SupportID: formData.supportCategory,
      Description: formData.description,
      SuppMarkingID: formData.refSupportMarking,
      StatusID: formData.supportStatus,
    };
    setSubmitting(true);
    try {
      const result = await createTicket(payload);
      if (!result.isSuccessful) {
        SwalError("Submission Failed", result.status);
        return;
      }
      SwalSuccess("Ticket Submitted!", `Ticket ID: ${result.title}`);
      setFormData({
        supportStatus: "NW",
        supportCategory: "",
        refSupportMarking: "",
        description: "",
      });
      setAttachments([]);
      // ✅ Refresh ticket list then switch to list tab
      await fetchTickets();
      setActiveTab("list");
    } catch {
      SwalError("Submission Error", "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const viewTicket = (ticket) => {
    if (!ticket) return;
    SwalInfoDynamic({
      title: `Ticket #AUS00${ticket.ticketIDNo}`,
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.7">
          <div style="margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px">Subject</div>
            <div style="padding:10px 12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">${ticket.subject}</div>
          </div>
          <div style="margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px">Status</div>
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;
              background:${ticket.status === "Resolved" ? "#dcfce7" : "#fef9c3"};
              color:${ticket.status === "Resolved" ? "#166534" : "#854d0e"}">
              ${ticket.status}
            </span>
          </div>
          <div style="margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px">Issue Description</div>
            <div style="padding:10px 12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;max-height:160px;overflow-y:auto;white-space:pre-wrap">${ticket.description || "—"}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px">IT Updates / Action</div>
            <div style="padding:10px 12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;max-height:160px;overflow-y:auto;white-space:pre-wrap">${ticket.actionNotes || "<i style='color:#9ca3af'>No updates yet</i>"}</div>
          </div>
        </div>`,
      width: "640px",
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter((t) =>
    [t.ticketIDNo, t.subject, t.status].some((v) =>
      v.toString().toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const { key, direction } = sortConfig;
    let av = a[key],
      bv = b[key];
    if (key === "auditDate") {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    } else {
      av = av.toString().toLowerCase();
      bv = bv.toString().toLowerCase();
    }
    if (av < bv) return direction === "asc" ? -1 : 1;
    if (av > bv) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTickets.length / ROWS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const displayedTickets = sortedTickets.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status !== "Resolved").length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resolved").length;

  // ── Early return — only block on refs, tickets load in background ─────────
  if (refsLoading) return <SkeletonLargeBoxes />;

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            IT Support Ticket
          </h2>
          <p className="mt-1 text-slate-600">
            Submit a request or view your existing tickets
          </p>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotifBell}
            className="relative flex items-center justify-center w-10 h-10 bg-white border rounded-lg border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full border-2 border-white px-1">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              notifications={notifications}
              onItemClick={handleNotificationClick}
            />
          )}
        </div>
      </div>

      {/* ── Stat Cards — show skeleton values while tickets load ── */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
        <StatCard
          label="Total Tickets"
          value={totalTickets}
          loading={ticketLoading}
          bg="bg-blue-100"
          icon={<Icon name="ticket" className="text-xl text-blue-600" />}
        />
        <StatCard
          label="Open / Pending"
          value={openTickets}
          loading={ticketLoading}
          bg="bg-yellow-100"
          icon={<Icon name="clock" className="text-xl text-yellow-600" />}
        />
        <StatCard
          label="Resolved"
          value={resolvedTickets}
          loading={ticketLoading}
          bg="bg-green-100"
          icon={<Icon name="circle-check" className="text-xl text-green-600" />}
        />
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { key: "create", label: "Create Ticket", icon: "plus" },
          {
            key: "list",
            label: "My Tickets",
            icon: "list",
            badge: unreadCount,
          },
        ].map(({ key, label, icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon name={icon} className="text-xs" />
            {label}
            {badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] text-[9px] font-bold bg-red-500 text-white rounded-full px-1">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CREATE TAB ── */}
      {activeTab === "create" && (
        <div className="bg-white border rounded-lg shadow border-slate-200 overflow-hidden max-w-4xl">
          <div className="h-1 bg-gradient-to-r from-green-700 to-green-500" />
          <div className="p-6">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-4">
              New Support Request
            </p>

            {/* Status */}
            <div className="mb-5">
              <label className="block mb-1.5 text-sm font-medium text-slate-700">
                Support Status
              </label>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-semibold text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                New / Open
              </span>
            </div>

            {/* Category + Marking */}
            <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Support Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.supportCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supportCategory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm outline-none"
                >
                  <option value="">Select category…</option>
                  {refSuppCategory.map((c) => (
                    <option key={c.supportID} value={c.supportID}>
                      {c.supportCategory}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">
                  Marking <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.refSupportMarking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      refSupportMarking: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm outline-none"
                >
                  <option value="">Select marking…</option>
                  {refSupportMarking.map((m) => (
                    <option key={m.supportMarkingID} value={m.supportMarkingID}>
                      {m.markingDesc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="block mb-1.5 text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your issue in detail — include any error messages, affected devices, or steps to reproduce…"
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm resize-y min-h-[120px] outline-none"
              />
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <label className="block mb-1.5 text-sm font-medium text-slate-700">
                Attachments{" "}
                <span className="text-slate-400 font-normal">
                  (optional · max 10 MB each)
                </span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 w-full px-6 py-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-green-500 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-green-400 transition-colors">
                  <Icon
                    name="arrow-up-from-bracket"
                    className="text-slate-400 group-hover:text-green-600 transition-colors"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 group-hover:text-green-700 transition-colors">
                    Click to upload or drag &amp; drop
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PNG, JPG, PDF, DOCX, XLSX up to 10 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {attachments.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg group"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-md bg-green-50 text-green-600 shrink-0">
                        <Icon
                          name={getFileIcon(file.name)}
                          className="text-sm"
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <Icon name="xmark" className="text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Icon name="spinner" className="fa-spin" /> Submitting…
                </>
              ) : (
                <>
                  <SendIcon /> Submit Ticket
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === "list" && (
        <>
          <div className="p-4 mb-4 bg-white border rounded-lg shadow border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                Filters
              </p>
              {/* ✅ Manual refresh button */}
              <button
                onClick={fetchTickets}
                disabled={ticketLoading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-700 disabled:opacity-50 transition-colors"
              >
                <Icon
                  name={ticketLoading ? "spinner fa-spin" : "rotate"}
                  className="text-[10px]"
                />
                {ticketLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by ticket no., subject, or status…"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden bg-white border rounded-lg shadow border-slate-200">
            {ticketLoading ? (
              <SkeletonLargeBoxes />
            ) : tickets.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <Icon name="ticket" className="text-3xl mb-3 block" />
                <p className="font-medium text-slate-600 mb-1">
                  No tickets yet
                </p>
                <p className="text-sm mb-4">
                  Create your first ticket using the tab above
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800"
                >
                  <Icon name="plus" /> Create a ticket
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-slate-50 border-slate-200">
                      <tr>
                        {[
                          { key: "ticketIDNo", label: "Ticket No." },
                          { key: "subject", label: "Subject" },
                          { key: "status", label: "Status" },
                          { key: "auditDate", label: "Created" },
                        ].map(({ key, label }) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          >
                            {label}
                            {sortConfig.key === key && (
                              <span className="ml-1 opacity-50">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTickets.map((ticket, idx) => {
                        const created = new Date(ticket.auditDate);
                        const formatted = format(created, "MMM dd, yyyy");
                        const daysDiff = Math.floor(
                          (Date.now() - created) / 86400000,
                        );
                        const showFollow =
                          daysDiff >= 3 && ticket.status !== "Resolved";

                        return (
                          <tr
                            key={ticket.ticketIDNo}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 !== 0 ? "bg-slate-50/50" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                                #AUS00{ticket.ticketIDNo}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <span className="text-sm text-slate-700 truncate block">
                                {ticket.subject}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {formatted}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewTicket(ticket)}
                                  className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                                  title="View Details"
                                >
                                  <Icon name="eye" className="text-sm" />
                                </button>
                                {showFollow && (
                                  <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors">
                                    <Icon
                                      name="arrow-up-right-from-square"
                                      className="text-[10px]"
                                    />
                                    Follow Up
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
