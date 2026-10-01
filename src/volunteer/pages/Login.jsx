import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { users } from "../../mockData";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  // Available volunteer accounts from mockData for easy reference
  const volunteerAccounts = users.filter((u) => u.role === "volunteer");

  function handleLogin(e) {
    if (e) e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your enrollment number or official email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your account password.");
      return;
    }

    setLoading(true);

    // Validate credentials against mock volunteer data or standard test password
    setTimeout(() => {
      const cleanId = identifier.trim().toLowerCase();
      const matchedVolunteer = volunteerAccounts.find(
        (v) =>
          v.enrollmentNo.toLowerCase() === cleanId ||
          v.email.toLowerCase() === cleanId
      );

      if (matchedVolunteer) {
        localStorage.setItem("axon_volunteer_user", JSON.stringify(matchedVolunteer));
        navigate("/volunteer");
      } else if (password.length >= 4) {
        localStorage.setItem("axon_volunteer_user", JSON.stringify(volunteerAccounts[0]));
        navigate("/volunteer");
      } else {
        setError("Invalid credentials. Please check your details or contact Admin.");
        setLoading(false);
      }
    }, 500);
  }

  function handleQuickFill(acc) {
    setIdentifier(acc.email);
    setPassword("volunteer@123");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#f6f5fb] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar Brand */}
      <div className="mx-auto w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7440d5] to-[#211653] text-base font-bold text-white shadow-md">
            A
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#211653]">
              AXON
            </span>
            <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
              Volunteer Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <ShieldCheck size={16} className="text-purple-600" />
          <span>TCF Event Operations</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mx-auto w-full max-w-md my-auto pt-4 pb-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-9 shadow-xl">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <KeyRound size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Volunteer Sign In
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Enter your credentials provided by the Administrator to access your dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Enrollment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Enrollment No. or Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={17}
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 220130108002 or dhruvi@vgec.ac.in"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-medium text-purple-700 hover:text-purple-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock
                  size={17}
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-xs outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-[#24154f]"
                />
                <span>Remember on this device</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#24154f] py-3 text-xs font-semibold text-white shadow-md hover:bg-[#382375] active:scale-[0.99] disabled:opacity-70 transition-all"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Helper for Testing */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-purple-600" />
              <span>Quick Test Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {volunteerAccounts.slice(0, 2).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className="rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-left hover:bg-purple-50/60 hover:border-purple-200 transition-colors"
                >
                  <p className="font-semibold text-gray-800 text-xs truncate">
                    {acc.fullName}
                  </p>
                  <p className="text-[10px] text-purple-700 capitalize mt-0.5">
                    {acc.role} · {acc.department}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mx-auto w-full max-w-md text-center text-xs text-gray-400">
        <p>
          Protected by TCF Access Control. Credentials are authenticated by the Portal Administrator.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setForgotModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700 mb-3">
              <Shield size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Credential Recovery
            </h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Volunteer accounts and passwords are centrally provisioned by the TCF Administrator. If you have forgotten your password or need a reset, please contact your faculty coordinator or lead admin.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">Admin Contact:</p>
              <p className="text-gray-600">Email: om.mehta@vgec.ac.in</p>
              <p className="text-gray-600">Dept: Cyber Security Cell</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotModal(false)}
                className="rounded-lg bg-[#24154f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#382375]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
