import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
const AdminDefaultRedirect = () => {
  const { userMenus } = useAuth();

  console.log(
    "AdminDefaultRedirect userMenus →",
    JSON.stringify(userMenus, null, 2),
  );

  if (!userMenus || userMenus.length === 0) {
    return <Navigate to="/access-denied" replace />;
  }

  for (const menu of userMenus) {
    console.log(
      "checking menu →",
      menu.menuName,
      menu.route,
      "subMenus →",
      menu.subMenus?.length,
    );
    if (menu.canView || menu.canCreate || menu.canEdit || menu.canDelete) {
      if (menu.subMenus && menu.subMenus.length > 0) {
        for (const sub of menu.subMenus) {
          console.log("  checking sub →", sub.menuName, sub.route, {
            canView: sub.canView,
            canCreate: sub.canCreate,
          });
          if (sub.canView || sub.canCreate || sub.canEdit || sub.canDelete) {
            console.log("  → navigating to sub →", sub.route);
            return <Navigate to={sub.route} replace />;
          }
        }
      }
      console.log("→ navigating to parent →", menu.route);
      return <Navigate to={menu.route} replace />;
    }
  }

  return <Navigate to="/access-denied" replace />;
};
export default AdminDefaultRedirect;
