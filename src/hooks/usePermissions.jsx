// hooks/usePermissions.js
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
export const usePermissions = () => {
  const { empPages } = useAuth();
  const location = useLocation();

  const getMenuPermissions = (route) => {
    for (const menu of empPages) {
      if (menu.PageRoute === route) {
        // ✅ PageRoute
        return {
          canView: menu.CanView, // ✅ CanView
          canCreate: menu.CanCreate, // ✅ CanCreate
          canEdit: menu.CanEdit, // ✅ CanEdit
          canDelete: menu.CanDelete, // ✅ CanDelete
        };
      }

      if (menu.subMenus) {
        const submenu = menu.subMenus.find((sub) => sub.PageRoute === route);
        if (submenu) {
          return {
            canView: submenu.CanView,
            canCreate: submenu.CanCreate,
            canEdit: submenu.CanEdit,
            canDelete: submenu.CanDelete,
          };
        }
      }
    }

    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  };

  const currentPermissions = getMenuPermissions(location.pathname);

  return {
    ...currentPermissions,
    getMenuPermissions,
  };
};
