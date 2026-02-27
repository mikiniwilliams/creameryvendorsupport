import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "vendor";
type UserStatus = "pending" | "active" | "disabled";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  vendor_id: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  status: UserStatus | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, role: null, status: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (profileRes.data) {
      const p = profileRes.data as Profile;
      setProfile(p);
      setStatus((p.status || "pending") as UserStatus);
    }
    if (rolesRes.data && rolesRes.data.length > 0) {
      const isAdmin = rolesRes.data.some((r: any) => r.role === "admin");
      setRole(isAdmin ? "admin" : (rolesRes.data[0].role as AppRole));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchUserData(user.id);
  }, [user, fetchUserData]);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).then(() => { if (mounted) setLoading(false); });
      } else {
        setProfile(null); setRole(null); setStatus(null); setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchUserData(session.user.id);
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setRole(null); setStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, status, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
