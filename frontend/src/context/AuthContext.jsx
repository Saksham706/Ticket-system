import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";

const AuthContext = createContext(null);
const normalizeUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    fullName: u.fullName || u.name || u.email?.split("@")[0] || "User",
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return normalizeUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {
      return null;
    }
  });
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setBootstrapping(false);
        return;
      }
      try {
        // A protected request validates the access token; a 401 interceptor tries refresh-cookie rotation.
        await client.get(endpoints.dashboard, { silentError: true });
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        if (active) setUser(null);
      } finally {
        if (active) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const persist = (result) => {
    const data = result?.data || result;
    if (data?.accessToken)
      localStorage.setItem("accessToken", data.accessToken);
    const nextUser = normalizeUser(data?.user);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    }
    return data;
  };

  const login = async (values) => {
    const response = await client.post(endpoints.auth.loginPassword, values);
    const data = payload(response);
    persist(data);
    toast.success("Welcome back!");
    return data;
  };

  const loginOtp = async (values) => {
    const response = await client.post(endpoints.auth.loginOtp, values);
    return payload(response);
  };

  const verifyLoginOtp = async (values) => {
    const response = await client.post(endpoints.auth.verifyLoginOtp, values);
    const data = payload(response);
    persist(data);
    toast.success("Signed in successfully");
    return data;
  };

  const register = async (values) =>
    payload(await client.post(endpoints.auth.register, values));
  const verifyOtp = async (values) =>
    payload(await client.post(endpoints.auth.verifyOtp, values));

  const logout = async () => {
    try {
      await client.post(endpoints.auth.logout, {});
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      toast.info("You have been logged out");
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      bootstrapping,
      login,
      loginOtp,
      verifyLoginOtp,
      register,
      verifyOtp,
      logout,
      isAuthenticated: Boolean(user && localStorage.getItem("accessToken")),
      isStaff: ["agent", "admin"].includes(
        String(user?.role || "").toLowerCase(),
      ),
      isAdmin: String(user?.role || "").toLowerCase() === "admin",
    }),
    [user, bootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
