import { create } from "zustand";
import type { User } from "@/types";
import { setSession, subscribeSession, type KaggriUser } from "@/services/api";

export function mapKaggriUserToAppUser(
  kUser: KaggriUser,
  accessToken?: string,
  refreshToken?: string
): User {
  const role: "buyer" | "vendor" =
    kUser.role === "VENDOR" ? "vendor" : "buyer";
  return {
    id: kUser.id,
    email: kUser.email,
    name: kUser.fullName || kUser.email.split("@")[0] || "Người dùng",
    phone: kUser.phone ?? undefined,
    role,
    company:
      kUser.buyerProfile?.companyName ??
      kUser.vendorProfile?.displayName ??
      undefined,
    taxCode: kUser.buyerProfile?.taxCode ?? undefined,
    buyerType:
      (kUser.buyerProfile?.buyerType as "INDIVIDUAL" | "BUSINESS") ??
      "INDIVIDUAL",
    accountStatus: kUser.accountStatus,
    vendorApprovalStatus: kUser.vendorProfile?.approvalStatus,
    token: accessToken,
    refreshToken,
  };
}

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  setRole: (role: "buyer" | "vendor") => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => {
    if (user.token) {
      setSession({
        accessToken: user.token,
        refreshToken: user.refreshToken || "",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          phone: user.phone ?? null,
          role: user.role === "vendor" ? "VENDOR" : "BUYER",
          accountStatus: user.accountStatus || "ACTIVE",
          buyerProfile: user.company
            ? {
                buyerType: user.buyerType || "BUSINESS",
                companyName: user.company,
                taxCode: user.taxCode || null,
              }
            : null,
          vendorProfile:
            user.role === "vendor"
              ? {
                  displayName: user.company || user.name,
                  approvalStatus: user.vendorApprovalStatus || "APPROVED",
                }
              : null,
        },
      });
    }
    set({ user, isAuthenticated: true });
  },

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  logout: () => {
    setSession(null);
    set({ user: null, isAuthenticated: false });
  },

  setRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
}));

subscribeSession((session) => {
  if (!session) {
    const current = useAuthStore.getState();
    // Only clear if the current user had a real token that expired
    if (current.isAuthenticated && current.user?.token && !current.user.token.startsWith("mock-token-")) {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
  } else {
    useAuthStore.setState({
      user: mapKaggriUserToAppUser(
        session.user,
        session.accessToken,
        session.refreshToken
      ),
      isAuthenticated: true,
    });
  }
});
