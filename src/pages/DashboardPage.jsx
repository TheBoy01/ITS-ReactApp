import React, { useState } from "react";
import AdminLayout from "./admin/layout/AdminLayout";
import Dashboard from "./admin/dashboard/Dashboard";

function App() {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    // <AdminLayout activeItem={activeItem} setActiveItem={setActiveItem}>
    <Dashboard />
    //</AdminLayout>
  );
}

export default App;
