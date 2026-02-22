import { React, useEffect, useState, useMemo } from "react";
import {
  getPendingTickets,
  createTicketHubConnection,
} from "../../../API/TicketAPI";
import * as signalR from "@microsoft/signalr";
import {
  SwalSuccess,
  SwalError,
  SwalWarning,
  ToastError,
  SwalConfirm,
  ToastInfo,
  SwalInfoDynamic,
} from "../../../utils/SwalAlert";
import { usePermissions } from "../../../hooks/usePermissions";

const TicketSupport = () => {
  // ========================================
  // State Management
  // ========================================
  const [isAdmin, setIsAdmin] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  // Tab State
  const [activeTab, setActiveTab] = useState("active"); // "active" or "accepted"

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search and Sort State
  const [searchTicket, setSearchTicket] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Modal State
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] =
    useState(null);
  const [selectedUser, setSelectedUser] = useState("");

  const { canCreate, canEdit, canDelete } = usePermissions();

  const users = [
    { id: 1, name: "Alice Cooper" },
    { id: 2, name: "Bob Martinez" },
    { id: 3, name: "Carol White" },
    { id: 4, name: "David Lee" },
  ];

  // ========================================
  // Utility Functions
  // ========================================

  // Format date: "Feb 09 2026 - Mon"
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const month = months[date.getMonth()];
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      const dayName = days[date.getDay()];

      return `${month} ${day} ${year} - ${dayName}`;
    } catch (e) {
      return dateString;
    }
  };

  // Normalize ticket data from backend
  const normalizeTicket = (ticket) => {
    return {
      ticketIDNo:
        ticket.ticketIDNo || ticket.TicketIDNo || ticket.id || ticket.Id,
      supportCategory: ticket.supportCategory || ticket.SupportCategory || "",
      markingDesc:
        ticket.markingDesc ||
        ticket.MarkingDesc ||
        ticket.priority ||
        ticket.Priority ||
        "",
      description: ticket.description || ticket.Description || "",
      empName:
        ticket.empName ||
        ticket.EmpName ||
        ticket.createdBy ||
        ticket.CreatedBy ||
        "",
      auditDate:
        ticket.auditDate ||
        ticket.AuditDate ||
        ticket.createdAt ||
        ticket.CreatedAt ||
        "",
      status: ticket.status || ticket.Status || "Pending",
      assignedToUserId:
        ticket.assignedToUserId || ticket.AssignedToUserId || null,
    };
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ========================================
  // Filter Tickets by Tab
  // ========================================
  const activeTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.status !== "Accepted");
  }, [tickets]);

  const acceptedTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.status === "Accepted");
  }, [tickets]);

  // Get current tab tickets
  const currentTabTickets =
    activeTab === "active" ? activeTickets : acceptedTickets;

  // ========================================
  // Sorting Logic
  // ========================================
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg
          className="w-4 h-4 ml-1 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortConfig.direction === "asc" ? (
      <svg
        className="w-4 h-4 ml-1 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1 text-blue-600"
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
  };

  // ========================================
  // Search, Sort, and Pagination Logic
  // ========================================
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = [...currentTabTickets];

    // Search filter
    if (searchTicket) {
      filtered = filtered.filter((ticket) => {
        const searchLower = searchTicket.toLowerCase();
        return (
          ticket.ticketIDNo?.toString().includes(searchLower) ||
          ticket.supportCategory?.toLowerCase().includes(searchLower) ||
          ticket.markingDesc?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.empName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";

        // Convert to string for comparison
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [currentTabTickets, searchTicket, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = filteredAndSortedTickets.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page
    setSearchTicket(""); // Clear search
    setSortConfig({ key: null, direction: "asc" }); // Reset sort
  };

  // ========================================
  // API and SignalR Functions
  // ========================================

  // Fetch pending tickets from API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await getPendingTickets();

      let ticketData = [];

      if (response && response.success && response.data) {
        ticketData = response.data;
      } else if (response && Array.isArray(response.data)) {
        ticketData = response.data;
      } else if (Array.isArray(response)) {
        ticketData = response;
      } else {
        console.warn("Unexpected response format:", response);
        ticketData = [];
      }

      // Normalize all tickets
      const normalizedTickets = ticketData.map(normalizeTicket);
      setTickets(normalizedTickets);
      setError(null);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load tickets. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize SignalR connection
  useEffect(() => {
    fetchTickets();

    const newConnection = createTicketHubConnection();
    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  // Start SignalR connection and setup listeners
  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("✅ SignalR Connected!");
          setConnectionStatus("Connected");

          // Listen for new ticket
          connection.on("ReceiveNewTicket", (newTicket) => {
            const normalizedTicket = normalizeTicket(newTicket);
            setTickets((prevTickets) => [normalizedTicket, ...prevTickets]);
            ToastInfo(`New Created Ticket #AUS00${newTicket.ticketIDNo}`);
          });

          // Listen for ticket update
          connection.on("ReceiveTicketUpdate", (updatedTicket) => {
            const normalizedTicket = normalizeTicket(updatedTicket);
            setTickets((prevTickets) =>
              prevTickets.map((ticket) =>
                ticket.ticketIDNo === normalizedTicket.ticketIDNo
                  ? normalizedTicket
                  : ticket,
              ),
            );
          });

          // Listen for status change
          connection.on("ReceiveStatusChange", (ticketId, newStatus) => {
            setTickets((prevTickets) =>
              prevTickets.map((ticket) =>
                ticket.ticketIDNo === ticketId
                  ? { ...ticket, status: newStatus }
                  : ticket,
              ),
            );
          });

          // Listen for assignment
          connection.on("ReceiveTicketAssignment", (ticketId, userId) => {
            setTickets((prevTickets) =>
              prevTickets.map((ticket) =>
                ticket.ticketIDNo === ticketId
                  ? { ...ticket, assignedToUserId: userId }
                  : ticket,
              ),
            );
          });
        })
        .catch((error) => {
          console.error("❌ SignalR Connection Error:", error);
          setConnectionStatus("Error");
        });

      connection.onreconnecting(() => {
        setConnectionStatus("Reconnecting");
      });

      connection.onreconnected(() => {
        setConnectionStatus("Connected");
      });

      connection.onclose(() => {
        setConnectionStatus("Disconnected");
      });
    }

    return () => {
      if (connection) {
        connection.off("ReceiveNewTicket");
        connection.off("ReceiveTicketUpdate");
        connection.off("ReceiveStatusChange");
        connection.off("ReceiveTicketAssignment");
      }
    };
  }, [connection]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ========================================
  // Action Handlers
  // ========================================

  const handleAccept = async (ticketId) => {
    try {
      // TODO: Call your API to accept the ticket
      // await acceptTicket(ticketId);

      setTickets(
        tickets.map((ticket) =>
          ticket.ticketIDNo === ticketId
            ? { ...ticket, status: "Accepted" }
            : ticket,
        ),
      );

      SwalSuccess(`Success`, `You have accepted Ticket #AUS00${ticketId}!`);
    } catch (error) {
      console.error("Error accepting ticket:", error);
      SwalError(
        error.response?.data?.message ||
          "Failed to accept ticket. Please try again.",
      );
    }
  };

  const handleAssignClick = (ticketId) => {
    setSelectedTicketForAssignment(ticketId);
    setSelectedUser("");
  };

  const handleAssignSubmit = async () => {
    if (selectedUser) {
      try {
        const userName = users.find(
          (u) => u.id === parseInt(selectedUser),
        )?.name;

        // TODO: Call your API to assign the ticket
        // await assignTicket(selectedTicketForAssignment, parseInt(selectedUser));

        SwalSuccess(
          `Ticket #AUS00${selectedTicketForAssignment} assigned to ${userName}`,
        );
        setSelectedTicketForAssignment(null);
        setSelectedUser("");
      } catch (error) {
        console.error("Error assigning ticket:", error);
        SwalError(
          error.response?.data?.message ||
            "Failed to assign ticket. Please try again.",
        );
      }
    }
  };

  // ========================================
  // Render: Loading State
  // ========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading tickets...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // Render: Error State
  // ========================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-md">
          <div className="mb-4 text-red-600">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Error Loading Tickets
          </h3>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={fetchTickets}
            className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // Render: Main Component
  // ========================================
  return (
    <div className="min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                Manage and track support tickets
              </p>
              {connection && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "Connected"
                        ? "bg-green-500 animate-pulse"
                        : connectionStatus === "Reconnecting"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-500 sm:text-sm">
                    {connectionStatus === "Connected"
                      ? "Live updates active"
                      : connectionStatus === "Reconnecting"
                        ? "Reconnecting..."
                        : connectionStatus === "Error"
                          ? "Connection error"
                          : "Disconnected"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={fetchTickets}
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                🔄 Refresh
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Admin:</span>
                <button
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    isAdmin
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  }`}
                >
                  {isAdmin ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange("active")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "active"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Active Tickets
                <span
                  className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                    activeTab === "active"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {activeTickets.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange("accepted")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "accepted"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Accepted Tickets
                <span
                  className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                    activeTab === "accepted"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {acceptedTickets.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <svg
                  className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
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
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTicket}
                  onChange={(e) => {
                    setSearchTicket(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>

            {/* Results info */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredAndSortedTickets.length)} of{" "}
              {filteredAndSortedTickets.length} tickets
              {searchTicket &&
                ` (filtered from ${currentTabTickets.length} total)`}
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        {currentTickets.length <= 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow-md">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchTicket
                ? "No tickets found"
                : activeTab === "active"
                  ? "No Active Tickets"
                  : "No Accepted Tickets"}
            </h3>
            <p className="mt-2 text-gray-600">
              {searchTicket
                ? "Try adjusting your search terms"
                : activeTab === "active"
                  ? "There are no pending tickets at the moment."
                  : "No tickets have been accepted yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden bg-white rounded-lg shadow-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Ticket ID */}
                      <th
                        onClick={() => handleSort("ticketIDNo")}
                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase cursor-pointer hover:bg-gray-100 sm:px-6"
                      >
                        <div className="flex items-center">
                          ID
                          {getSortIcon("ticketIDNo")}
                        </div>
                      </th>

                      {/* Title */}
                      <th
                        onClick={() => handleSort("supportCategory")}
                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase cursor-pointer hover:bg-gray-100 sm:px-6"
                      >
                        <div className="flex items-center">
                          Title
                          {getSortIcon("supportCategory")}
                        </div>
                      </th>

                      {/* Priority */}
                      <th
                        onClick={() => handleSort("markingDesc")}
                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase cursor-pointer hover:bg-gray-100 sm:px-6"
                      >
                        <div className="flex items-center">
                          Priority
                          {getSortIcon("markingDesc")}
                        </div>
                      </th>

                      {/* Description - Hidden on small screens */}
                      <th className="hidden px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase lg:table-cell sm:px-6">
                        Description
                      </th>

                      {/* Created By */}
                      <th
                        onClick={() => handleSort("empName")}
                        className="hidden px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase cursor-pointer hover:bg-gray-100 md:table-cell sm:px-6"
                      >
                        <div className="flex items-center">
                          Created By
                          {getSortIcon("empName")}
                        </div>
                      </th>

                      {/* Created At */}
                      <th
                        onClick={() => handleSort("auditDate")}
                        className="hidden px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase cursor-pointer hover:bg-gray-100 xl:table-cell sm:px-6"
                      >
                        <div className="flex items-center">
                          Created At
                          {getSortIcon("auditDate")}
                        </div>
                      </th>

                      {/* Actions - Only show for Active Tickets */}
                      {activeTab === "active" && (
                        <th className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase sm:px-6">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTickets.map((ticket) => (
                      <tr
                        key={`ticket-${ticket.ticketIDNo}`}
                        className="transition-colors hover:bg-gray-50"
                      >
                        {/* Ticket ID */}
                        <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap sm:px-6">
                          #AUS00{ticket.ticketIDNo}
                        </td>

                        {/* Title */}
                        <td className="px-3 py-4 sm:px-6">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.supportCategory}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                              ticket.markingDesc,
                            )}`}
                          >
                            {ticket.markingDesc}
                          </span>
                        </td>

                        {/* Description - Hidden on small screens */}
                        <td className="hidden px-3 py-4 text-sm text-gray-700 lg:table-cell sm:px-6">
                          <div className="max-w-xs truncate">
                            {ticket.description}
                          </div>
                        </td>

                        {/* Created By - Hidden on small screens */}
                        <td className="hidden px-3 py-4 text-sm text-gray-700 whitespace-nowrap md:table-cell sm:px-6">
                          {ticket.empName}
                        </td>

                        {/* Created At - Hidden on small screens */}
                        <td className="hidden px-3 py-4 text-sm text-gray-500 whitespace-nowrap xl:table-cell sm:px-6">
                          {formatDate(ticket.auditDate)}
                        </td>

                        {/* Actions - Only show for Active Tickets */}
                        {activeTab === "active" && (
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => handleAccept(ticket.ticketIDNo)}
                                disabled={ticket.status === "Accepted"}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors sm:text-sm sm:px-4 sm:py-2 ${
                                  ticket.status === "Accepted"
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {ticket.status === "Accepted"
                                  ? "Accepted"
                                  : "Accept"}
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() =>
                                    handleAssignClick(ticket.ticketIDNo)
                                  }
                                  className="px-3 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 sm:text-sm sm:px-4 sm:py-2"
                                >
                                  Assign
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 mt-4 bg-white border-t border-gray-200 rounded-lg shadow-sm sm:flex-row sm:px-6">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden gap-1 sm:flex">
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof page === "number" && handlePageChange(page)
                        }
                        disabled={page === "..."}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : page === "..."
                              ? "bg-white text-gray-400 cursor-default"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Assignment Modal */}
        {selectedTicketForAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Assign Ticket #AUS00{selectedTicketForAssignment}
              </h3>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTicketForAssignment(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={!selectedUser}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedUser
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Assign Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketSupport;
