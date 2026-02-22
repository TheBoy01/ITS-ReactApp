// hooks/usePermissions.js
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";

export const usePermissions = () => {
  const { userMenus } = useAuth();
  const location = useLocation();

  const getMenuPermissions = (route) => {
    // Find menu by route (check both parent and submenu)
    for (const menu of userMenus) {
      if (menu.route === route) {
        return {
          canView: menu.canView,
          canCreate: menu.canCreate,
          canEdit: menu.canEdit,
          canDelete: menu.canDelete,
        };
      }

      // Check submenus
      if (menu.subMenus) {
        const submenu = menu.subMenus.find((sub) => sub.route === route);
        if (submenu) {
          return {
            canView: submenu.canView,
            canCreate: submenu.canCreate,
            canEdit: submenu.canEdit,
            canDelete: submenu.canDelete,
          };
        }
      }
    }

    // No permissions found
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
