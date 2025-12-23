import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getReferenceLists } from "../../API/ReferencesAPI";
import {
  createTicket,
  getTicketListByUserID,
  getTicketNotificationListByUser,
  markNotificationAsRead,
} from "../../API/TicketAPI";
import SkeletonLargeBoxes from "../skeletons/SkeletonLargeBoxes";
import {
  SwalSuccess,
  SwalError,
  SwalWarning,
  ToastError,
  SwalConfirm,
  ToastInfo,
  SwalInfoDynamic,
} from "../../utils/SwalAlert";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createNotificationConnection } from "../../signalr/notificationConnection";

export default function TicketPage() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("create");
  const [refSuppCategory, setSupportCategories] = useState([]);
  const [refSupportMarking, setMarkings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [formData, setFormData] = useState({
    supportStatus: "NW",
    supportCategory: "",
    refSupportMarking: "",
    description: "",
  });

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const [searchText, setSearchText] = useState("");

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    key: "ticketIDNo",
    direction: "asc",
  });

  // Expanded rows for small screens
  const [expandedRows, setExpandedRows] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const notifRef = useRef(null);
  // ----------------- Load References -----------------
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const refs = await getReferenceLists();
        setSupportCategories(refs.refSuppCategory || []);
        setMarkings(refs.refSupportMarking || []);
      } catch (err) {
        SwalError("Something went wrong", "Could not load references.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReferences();
  }, []);

  // ----------------- Load Tickets -----------------
  useEffect(() => {
    const fetchTickets = async () => {
      setTicketLoading(true);
      try {
        const list = await getTicketListByUserID(user.empID);
        setTickets(list || []);
      } catch (err) {
        SwalError("Failed to load tickets", "Please try again later.");
        console.error(err);
      } finally {
        setTicketLoading(false);
      }
    };

    if (activeTab === "list") fetchTickets();
  }, [activeTab, user.empID]);

  // ----------------- Notifications ------------------
  /* -------------------- LOAD NOTIFICATIONS (LOGIN) -------------------- */
  useEffect(() => {
    if (!user?.empID) return;

    const loadNotifications = async () => {
      try {
        const data = (await getTicketNotificationListByUser()) || [];

        // Keep all notifications for dropdown
        setNotifications(data);

        // Compute bell count: tickets with unread notifications
        const updatesByTicket = {};
        data
          .filter((n) => !n.isRead)
          .forEach((n) => {
            updatesByTicket[n.taskID] = (updatesByTicket[n.taskID] || 0) + 1;
          });

        // Show toast for each ticket
        Object.entries(updatesByTicket)
          .filter(([taskID, count]) => count > 0)
          .forEach(([taskID, count]) => {
            ToastInfo(`You have ${count} update(s) in Ticket #AUS00${taskID}`);
          });
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    loadNotifications();
  }, [user.empID]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  /* -------------------- SIGNALR (REALTIME) -------------------- */
  useEffect(() => {
    if (!user?.empID || !user?.token) return;

    const connection = createNotificationConnection(user.token);

    connection.on("ReceiveNotification", (notif) => {
      ToastInfo(notif.message);

      setNotifications((prev) => [{ ...notif, isRead: false }, ...prev]);
    });

    connection
      .start()
      .then(() => connection.invoke("JoinUser", user.empID))
      .catch((err) => console.error("SignalR error", err));

    return () => connection.stop();
  }, [user.empID, user.token]);

  useEffect(() => {
    if (!user?.role) return;

    if (user.role.toLowerCase() === "admin") {
      //ToastError("Invalid user credentials. Please login again.");
      logout();
    }
  }, [user?.role]);

  /* -------------------- CLICK NOTIFICATION -------------------- */
  const handleNotificationClick = async (notif) => {
    //setNotifications((prev) =>
    // prev.map((n) =>
    //   n.notificationID === notif.notificationID ? { ...n, isRead: true } : n
    //   )
    // );

    setShowNotifications(false);
    viewTicket(tickets.find((a) => a.ticketIDNo === notif.taskID));
  };

  const handleNotifBell = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setShowNotifications(true);
    if (unreadCount > 0) await markNotificationAsRead();
  };
  // ----------------- Notifications Ends ------------------

  // ----------------- Logout -----------------
  const handleLogout = async () => {
    const ok = await SwalConfirm("Logout", "Are you sure you want to logout?");
    if (ok) logout();
  };

  // ----------------- Submit Ticket -----------------
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

      // Reset form
      setFormData({
        supportStatus: "NW",
        supportCategory: "",
        refSupportMarking: "",
        description: "",
      });

      setActiveTab("list");
    } catch (err) {
      SwalError("Submission Error", "Something went wrong.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------- View / Follow Up -----------------
  const viewTicket = (ticket) => {
    //ToastInfo(`View Ticket ID: ${ticketID}`);
    const buildTicketDetailsHTML = (ticket) => {
      return `
  <div style="text-align:left; font-size:14px; line-height:1.6">

    <!-- SUBJECT -->
    <div style="margin-bottom:12px">
      <div style="font-weight:600; color:#374151;">Subject</div>
      <div style="
        margin-top:4px;
        padding:8px;
        background:#f9fafb;
        border-radius:6px;
        word-break:break-word;
      ">
        ${ticket.subject}
      </div>
    </div>

    <!-- STATUS -->
    <div style="margin-bottom:12px">
      <div style="font-weight:600; color:#374151;">Status</div>
      <div style="margin-top:6px;">
        <span style="
          display:inline-block;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
          font-weight:600;
          background:${ticket.status === "Resolved" ? "#dcfce7" : "#fef9c3"};
          color:${ticket.status === "Resolved" ? "#166534" : "#854d0e"};
        ">
          ${ticket.status}
        </span>
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div>
      <div style="font-weight:600; color:#374151;">Issue Description</div>
      <div style="
        margin-top:6px;
        padding:10px;
        background:#f9fafb;
        border-radius:6px;
        max-height:220px;
        overflow-y:auto;
        white-space:pre-wrap;
        word-break:break-word;
      ">${ticket.description || "-"}
      </div>
    </div>

    <!-- IT Updates/Action -->
    <div>
      <div style="font-weight:600; color:#374151;">IT Updates / Action</div>
      <div style="
        margin-top:6px;
        padding:10px;
        background:#f9fafb;
        border-radius:6px;
        max-height:220px;
        overflow-y:auto;
        white-space:pre-wrap;
        word-break:break-word;
      "><b>${ticket.actionNotes || "<i>No updates yet </i>"}</b>
      </div>
    </div>

  </div>
`;
    };
    SwalInfoDynamic({
      title: `Details for Ticket ID No: AUS00${ticket.ticketIDNo}`,
      html: buildTicketDetailsHTML(ticket),
      width: "700px",
    });
  };

  const handleFollowUp = (ticketID) => {
    SwalSuccess("Follow Up", `You followed up on ticket ${ticketID}`);
  };

  // ----------------- Sorting -----------------
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  // ----------------- Filtering & Pagination -----------------
  const filteredTickets = tickets.filter((t) =>
    [t.ticketIDNo, t.subject, t.status].some((val) =>
      val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (key === "auditDate") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTickets.length / rowsPerPage);
  const displayedTickets = sortedTickets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  if (loading) return <SkeletonLargeBoxes />; //<SkeletonLargeBoxes />;

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />
      <h1 className="text-2xl font-semibold">Hello {user?.name || "User"}</h1>
      <p className="mt-2 text-gray-700">
        You are now authenticated and can submit your IT ticket.
      </p>

      <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-[1200px] mx-auto px-4">
        {/* Tabs */}
        <div className="mb-4 border-b border-gray-300">
          <ul className="flex justify-center gap-6 text-sm font-medium">
            {["create", "list"].map((tab) => (
              <li key={tab}>
                <button
                  className={`px-4 py-2 border-b-2 ${
                    activeTab === tab
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-600 hover:text-green-600"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "create" ? "Create a ticket" : "My ticket list"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab Content */}
        <div className="w-full p-4 bg-gray-100 rounded-lg">
          {activeTab === "create" && (
            <div className="w-full max-w-3xl p-6 mx-auto bg-white rounded-lg shadow">
              <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium">
                    Support Status
                  </label>
                  <input
                    type="text"
                    value="New / Open"
                    disabled
                    className="px-3 py-2 italic bg-gray-100 border rounded-md cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium">
                    Support Category
                  </label>
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={formData.supportCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supportCategory: e.target.value,
                      })
                    }
                  >
                    <option value="">Select category...</option>
                    {refSuppCategory.map((cat) => (
                      <option key={cat.supportID} value={cat.supportID}>
                        {cat.supportCategory}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium">Marking</label>
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={formData.refSupportMarking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refSupportMarking: e.target.value,
                      })
                    }
                  >
                    <option value="">Select marking...</option>
                    {refSupportMarking.map((m) => (
                      <option
                        key={m.supportMarkingID}
                        value={m.supportMarkingID}
                      >
                        {m.markingDesc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    className="px-3 py-2 border rounded-md"
                    placeholder="Describe your issue..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </form>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full px-4 py-2 mt-6 text-white bg-green-600 rounded-md disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          )}

          {activeTab === "list" && (
            <div className="w-full max-w-5xl mx-auto">
              {/* Header + Notifications */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Tickets</h2>

                {/* 🔔 NOTIFICATION BELL */}
                <div className="relative">
                  <button
                    onClick={() => handleNotifBell()}
                    className="relative p-2 rounded-full hover:bg-gray-100"
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div
                      className="absolute right-0 z-50 mt-2 bg-white border rounded shadow w-80"
                      ref={notifRef}
                    >
                      <div className="px-4 py-2 font-semibold border-b">
                        Notifications
                      </div>

                      {notifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        <ul className="overflow-y-auto max-h-64">
                          {notifications.map((n) => (
                            <li
                              key={n.notificationID} // use the unique ID from backend
                              onClick={() => handleNotificationClick(n)}
                              className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 ${
                                !n.isRead ? "bg-blue-50" : ""
                              }`}
                            >
                              <div className="font-medium">
                                Ticket #AUS00{n.taskID} -{" "}
                                {n.notificationMessage}
                              </div>
                              <div className="text-xs text-gray-600">
                                {n.message}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search any data.."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {ticketLoading ? (
                <SkeletonLargeBoxes />
              ) : tickets.length === 0 ? (
                <p className="text-center text-gray-500">No tickets found.</p>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th
                            className="px-4 py-3 text-sm font-semibold text-left text-gray-700 cursor-pointer"
                            onClick={() => handleSort("ticketIDNo")}
                          >
                            Ticket No.{" "}
                            {sortConfig.key === "ticketIDNo"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </th>
                          <th
                            className="hidden px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer sm:table-cell"
                            onClick={() => handleSort("subject")}
                          >
                            Subject{" "}
                            {sortConfig.key === "subject"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </th>
                          <th
                            className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer"
                            onClick={() => handleSort("status")}
                          >
                            Status{" "}
                            {sortConfig.key === "status"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </th>
                          <th
                            className="hidden px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer md:table-cell"
                            onClick={() => handleSort("auditDate")}
                          >
                            Created{" "}
                            {sortConfig.key === "auditDate"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </th>
                          <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {displayedTickets.map((ticket) => {
                          const createdDate = new Date(ticket.auditDate);
                          const formattedDate = format(
                            createdDate,
                            "MMM dd, yyyy - EEE"
                          );
                          const daysDiff = Math.floor(
                            (Date.now() - createdDate) / (1000 * 60 * 60 * 24)
                          );
                          const showFollowUp =
                            daysDiff >= 3 && ticket.status !== "Resolved";
                          const isExpanded = expandedRows.includes(
                            ticket.ticketIDNo
                          );

                          return (
                            <React.Fragment key={ticket.ticketIDNo}>
                              <tr className="hover:bg-gray-50">
                                <td className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                                  #AUS00{ticket.ticketIDNo}
                                  <button
                                    className="sm:hidden"
                                    onClick={() => toggleRow(ticket.ticketIDNo)}
                                  >
                                    ▼
                                  </button>
                                  <div className="text-xs text-gray-500 sm:hidden">
                                    {ticket.subject}
                                  </div>
                                </td>
                                <td className="hidden px-4 py-3 text-sm sm:table-cell">
                                  {ticket.subject}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      ticket.status === "Resolved"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {ticket.status}
                                  </span>
                                </td>
                                <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell">
                                  {formattedDate}
                                </td>
                                <td className="flex flex-wrap gap-2 px-4 py-3">
                                  <button
                                    className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                    onClick={() => viewTicket(ticket)}
                                  >
                                    View
                                  </button>
                                  {showFollowUp && (
                                    <button
                                      className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                                      onClick={() =>
                                        handleFollowUp(ticket.ticketID)
                                      }
                                    >
                                      Follow Up
                                    </button>
                                  )}
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-gray-50 sm:hidden">
                                  <td
                                    colSpan={5}
                                    className="px-4 py-2 space-y-1 text-sm text-gray-700"
                                  >
                                    <div>
                                      <strong>Status:</strong> {ticket.status}
                                    </div>
                                    <div>
                                      <strong>Created:</strong> {formattedDate}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`px-3 py-1 border rounded ${
                            currentPage === i + 1
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        className="block w-full px-4 py-2 mx-auto mt-3 text-white bg-blue-600 rounded-md sm:w-1/2 md:w-1/3"
        onClick={handleLogout}
      >
        Log Out
      </button>
    </div>
  );
}
