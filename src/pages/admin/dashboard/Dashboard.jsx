import { React, useEffect, useState } from "react";

const HomeIcon = () => (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const TicketIcon = () => (
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
      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
    />
  </svg>
);

const PackageIcon = () => (
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
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const UsersIcon = () => (
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
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const StatsCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change >= 0;

  return (
    <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon />
        </div>
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
      <h3 className="mb-1 text-sm text-slate-600">{title}</h3>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
};

const Dashboard = () => {
  const stats = [
    {
      title: "Total Tickets",
      value: "156",
      change: 12,
      icon: TicketIcon,
      color: "bg-blue-500 text-white",
    },
    {
      title: "Inventory Items",
      value: "1,234",
      change: 5,
      icon: PackageIcon,
      color: "bg-green-500 text-white",
    },
    {
      title: "Active Teachers",
      value: "89",
      change: -2,
      icon: UsersIcon,
      color: "bg-purple-500 text-white",
    },
    {
      title: "Pending Tasks",
      value: "23",
      change: 8,
      icon: HomeIcon,
      color: "bg-orange-500 text-white",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h2>
        <p className="mt-1 text-slate-600">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Recent Tickets
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    Ticket #{1000 + item}
                  </p>
                  <p className="text-sm text-slate-600">
                    Network connectivity issue
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white border rounded-lg shadow border-slate-200">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full p-4 text-left transition-colors rounded-lg bg-blue-50 hover:bg-blue-100">
              <p className="font-medium text-blue-800">Create New Ticket</p>
              <p className="text-sm text-blue-600">
                Submit a new support request
              </p>
            </button>
            <button className="w-full p-4 text-left transition-colors rounded-lg bg-green-50 hover:bg-green-100">
              <p className="font-medium text-green-800">Add Inventory Item</p>
              <p className="text-sm text-green-600">Register new equipment</p>
            </button>
            <button className="w-full p-4 text-left transition-colors rounded-lg bg-purple-50 hover:bg-purple-100">
              <p className="font-medium text-purple-800">View Reports</p>
              <p className="text-sm text-purple-600">
                Access analytics and insights
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
