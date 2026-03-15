import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket, CreditCard, Clock, ShieldCheck,
  ClipboardList, Scale, Users2
} from "lucide-react";

const Auth = () => {
  const { user, role, status } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    if (role === "admin") { navigate("/", { replace: true }); return null; }
    if (status === "active") { navigate("/", { replace: true }); return null; }
    navigate("/onboarding", { replace: true }); return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      if (!fullName.trim()) {
        toast({ title: "Error", description: "Full name is required.", variant: "destructive" });
        setLoading(false); return;
      }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created", description: "Please check your email to verify your account." });
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
    }
  };

  const trustBadges = [
    { icon: CreditCard, label: "No credit card required" },
    { icon: Clock, label: "Setup in 10 min" },
    { icon: ShieldCheck, label: "Secure & private" },
  ];

  const features = [
    { icon: ClipboardList, label: "Track every complaint" },
    { icon: Scale, label: "Hold vendors accountable" },
    { icon: Users2, label: "Close the loop for buyers" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ backgroundColor: "#18120a" }}
      >
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(232,160,32,0.1) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#E8A020" }}>
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-lg tracking-tight">VendorCare Connect</p>
              <p className="text-xs" style={{ color: "#8a8070" }}>The Creamery</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              Vendor accountability<br />made simple
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#b8b0a0" }}>
              Streamline vendor support, track complaints from submission to resolution,
              and ensure every issue gets the attention it deserves.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3">
            {trustBadges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
                style={{ backgroundColor: "rgba(232,160,32,0.08)", color: "#d4cbbf" }}
              >
                <b.icon className="h-3.5 w-3.5" style={{ color: "#E8A020" }} />
                {b.label}
              </div>
            ))}
          </div>

          {/* Feature bullets */}
          <div className="space-y-4 pt-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(232,160,32,0.14)" }}
                >
                  <f.icon className="h-4 w-4" style={{ color: "#E8A020" }} />
                </div>
                <span className="text-sm font-medium text-white">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs" style={{ color: "#5c5a55" }}>
          Powered by <span className="font-semibold" style={{ color: "#8a8070" }}>DAY1044 Solutions</span>
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-10" style={{ backgroundColor: "#fdf9f3" }}>
        <div className="w-full max-w-sm space-y-8">
          {/* Pill toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-full p-1" style={{ backgroundColor: "#f0ebe2" }}>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="rounded-full px-5 py-2 text-sm font-medium transition-all"
                style={isLogin
                  ? { backgroundColor: "#18120a", color: "#fff" }
                  : { backgroundColor: "transparent", color: "#8a8070" }
                }
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="rounded-full px-5 py-2 text-sm font-medium transition-all"
                style={!isLogin
                  ? { backgroundColor: "#18120a", color: "#fff" }
                  : { backgroundColor: "transparent", color: "#8a8070" }
                }
              >
                Create account
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold" style={{ color: "#18120a" }}>
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm" style={{ color: "#8a8070" }}>
              {isLogin
                ? "Sign in to manage your vendor support tickets"
                : "Get started with VendorCare Connect"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8070" }}>
                  Full Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="h-11 rounded-lg border-[#e0d9ce] bg-white placeholder:text-[#c4bbab] focus-visible:ring-[#E8A020]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8070" }}>
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-11 rounded-lg border-[#e0d9ce] bg-white placeholder:text-[#c4bbab] focus-visible:ring-[#E8A020]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8070" }}>
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-xs font-medium hover:underline" style={{ color: "#E8A020" }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11 rounded-lg border-[#e0d9ce] bg-white placeholder:text-[#c4bbab] focus-visible:ring-[#E8A020]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "#E8A020", color: "#fff" }}
            >
              {loading
                ? "Please wait…"
                : isLogin
                  ? "Sign in to VendorCare"
                  : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e0d9ce" }} />
            <span className="text-xs" style={{ color: "#b8b0a0" }}>or continue with</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e0d9ce" }} />
          </div>

          {/* Google SSO */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-lg border-[#e0d9ce] bg-white text-sm font-medium hover:bg-[#f5f0e8]"
            style={{ color: "#18120a" }}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Bottom link */}
          <p className="text-center text-sm" style={{ color: "#8a8070" }}>
            {isLogin ? (
              <>Don't have an account?{" "}
                <button type="button" onClick={() => setIsLogin(false)} className="font-medium hover:underline" style={{ color: "#E8A020" }}>
                  Request access
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => setIsLogin(true)} className="font-medium hover:underline" style={{ color: "#E8A020" }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
