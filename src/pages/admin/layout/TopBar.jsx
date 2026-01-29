import React from "react";

const MenuIcon = () => (
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
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

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

const BellIcon = () => (
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
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const TopBar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 px-4 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg lg:hidden hover:bg-slate-100"
          >
            <MenuIcon />
          </button>
          {/* Search Bar 
          <div className="relative hidden md:block">
            <div className="absolute transform -translate-y-1/2 left-3 top-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-64 py-2 pl-10 pr-4 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          */}
        </div>
        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-slate-100">
            <BellIcon />
            <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
