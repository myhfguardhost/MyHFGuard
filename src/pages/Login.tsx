import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Stethoscope, HeartPulse } from "lucide-react";

import logoImg from "@/assets/loginlogo.jpg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const PATIENT_LOGIN_DOMAIN = (
  (import.meta.env.VITE_PATIENT_LOGIN_DOMAIN as string | undefined)
    ?.trim()
    .toLowerCase() || "myhfguard.local"
).replace(/^@+/, "");

const LEGACY_PATIENT_LOGIN_DOMAINS = ["patients.myhfguard.local"];

function loginEmailsFromIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  if (normalized.includes("@")) return [normalized];

  return Array.from(
    new Set([
      `${normalized}@${PATIENT_LOGIN_DOMAIN}`,
      ...LEGACY_PATIENT_LOGIN_DOMAINS.map(
        (domain) => `${normalized}@${domain}`
      ),
    ])
  );
}

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const identifier = formData.userId.trim();
    if (!identifier) {
      setError("Please enter your User ID.");
      setIsSubmitting(false);
      return;
    }

    let signInError: Error | null = null;

    for (const email of loginEmailsFromIdentifier(identifier)) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (!error) {
        signInError = null;
        break;
      }

      signInError = error;
    }

    if (signInError) {
      setError("Invalid User ID or password.");
      setIsSubmitting(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const role = data?.session?.user?.app_metadata?.role;

    if (role === "admin") {
      await supabase.auth.signOut();
      setError("This is an admin account. Please use the Admin Login page.");
      setIsSubmitting(false);
      return;
    }

    if (role !== "patient") {
      await supabase.auth.signOut();
      setError("Your account is not authorized as a patient.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    const userId = data?.session?.user?.id;
    let profileCompleted = false;

    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", userId)
        .maybeSingle();
      profileCompleted = !!profile?.profile_completed;
    }

    localStorage.setItem("profileCompleted", profileCompleted ? "true" : "false");
    navigate(profileCompleted ? "/" : "/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20">
              <HeartPulse className="w-7 h-7" />
              <span className="text-xl font-semibold">HFGuard</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-4">
              Welcome back to your care companion
            </h2>
            <p className="text-lg text-white/90 leading-8 max-w-xl">
              Log in to monitor your health, review reminders and stay connected
              with your daily heart failure care tools.
            </p>
          </div>

          <div className="relative z-10 space-y-4 mt-10">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-base">Secure patient login and data access</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
              <Stethoscope className="w-6 h-6" />
              <span className="text-base">Track your daily health and symptoms</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10 bg-white/70 dark:bg-slate-950/50">
          <Card className="w-full max-w-md border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-none rounded-[28px] backdrop-blur-md">
            <CardHeader className="space-y-4 pt-8">
              <div className="flex justify-end">
                <Link
                  to="/admin/login"
                  className="text-sm text-sky-600 dark:text-cyan-300 hover:text-sky-500 dark:hover:text-cyan-200 font-medium"
                >
                  Admin Login
                </Link>
              </div>

              <div className="flex justify-center">
                <div className="rounded-3xl bg-white p-4 shadow-lg border border-slate-200">
                  <img
                    src={logoImg}
                    alt="HFGuard Logo"
                    className="h-16 md:h-20 w-auto object-contain"
                  />
                </div>
              </div>

              <CardTitle className="text-4xl font-bold text-center text-slate-900 dark:text-white">
                Sign in
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-600 dark:text-slate-300">
                Enter the User ID assigned by the administrator
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-slate-800 dark:text-white">
                    User ID
                  </Label>
                  <Input
                    id="userId"
                    name="userId"
                    type="text"
                    placeholder="patient001"
                    value={formData.userId}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                    className="h-12 rounded-2xl border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus-visible:ring-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-800 dark:text-white">
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    className="h-12 rounded-2xl border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus-visible:ring-cyan-400"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-300 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center pb-8">
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                Need an account? Please contact the administrator.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
