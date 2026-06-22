import { Ionicons } from "@expo/vector-icons";
export type IconName = keyof typeof Ionicons.glyphMap;
import { AuthUser } from "../../auth/types/auth.types";
// account Types
export interface AccountMenuItemProps {
  icon: IconName;
  label: string;
  route: string | null;
  onPress: (route: string) => void;
  showBorder: boolean;
}

export interface UseAccountReturn {
  query: {
    user: AuthUser | null;
  };
  state: {
    isLoggingOut: boolean;
  };
  actions: {
    handleLogout: () => void;
  };
  router: {
    navigateTo: (route: string) => void;
    navigateToProfile: () => void;
  };
}
