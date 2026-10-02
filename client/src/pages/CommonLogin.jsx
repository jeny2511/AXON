import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  GraduationCap,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  User,
  Phone,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getAllUsers, loginUser, registerStudent } from "../services/authService";

export default function CommonLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get("role");
  const redirectParam = searchParams.get("redirect");

  // Selected Role tab: 'student' | 'volunteer' | 'admin'
  const [selectedRole, setSelectedRole] = useState(
    initialRoleParam === "volunteer"
      ? "volunteer"
      : initialRoleParam === "admin"
      ? "admin"
      : "student"
  );

  // Student auth mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState("login");

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student registration form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    department: "IT",
    year: 3,
    semester: 5,
    enrollmentNo: "",
    phone: "",
    batch: "2024-2028",
  });

  const allUsers = getAllUsers();
  const demoStudents = allUsers.filter((u) => u.role === "student");
  const demoVolunteers = allUsers.filter((u) => u.role === "volunteer");
  const demoAdmin = allUsers.find((u) => u.role === "admin");

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setAuthMode("login");
    setError("");
    setIdentifier("");
    setPassword("");
  };

  const getDestinationPath = (userRole) => {
    if (redirectParam) return redirectParam;
    if (userRole === "student") return "/dashboard";
    if (userRole === "volunteer") return "/volunteer";
    if (userRole === "admin") return "/admin";
    return "/dashboard";
  };

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Email, Enrollment No., or User ID.");
      return;
    }

    setLoading(true);
    try {
      const user = loginUser(identifier, password, selectedRole);
      navigate(getDestinationPath(user.role));
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (user) => {
    setError("");
    setLoading(true);
    try {
      const loggedIn = loginUser(user.id, "demo123", user.role);
      navigate(getDestinationPath(loggedIn.role));
    } catch (err) {
      setError(err.message || "Failed to sign in with demo user.");
      setLoading(false);
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "year") {
        const y = Number(value) || 1;
        updated.semester = y * 2 - 1;
        const startYear = 2026 - y + 1;
        updated.batch = `${startYear}-${startYear + 4}`;
      }
      return updated;
    });
    setError("");
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!signupData.fullName.trim() || !signupData.email.trim()) {
      setError("Full name and college email are required.");
      return;
    }

    setLoading(true);
    try {
      const newStudent = registerStudent(signupData);
      navigate(getDestinationPath(newStudent.role));
    } catch (err) {
      setError(err.message || "Failed to register student account.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6fc] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased text-gray-900">
      {/* Top Brand Bar */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7040d0] to-[#211653] text-base font-bold text-white shadow-md">
            A
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#211653]">
              AXON
            </span>
            <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-[#7040d0]">
              Unified Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
          <ShieldCheck size={16} className="text-[#7040d0]" />
          <span>The Cyber Force (TCF) • VGEC</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="mx-auto w-full max-w-lg my-auto pt-4 pb-8">
        <div className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-9 shadow-xl shadow-purple-900/5">
          {/* Header Title */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#7040d0]">
              {selectedRole === "student" ? (
                <GraduationCap size={26} />
              ) : selectedRole === "volunteer" ? (
                <Users size={24} />
              ) : (
                <Shield size={24} />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {selectedRole === "student"
                ? authMode === "signup"
                  ? "Student Registration"
                  : "Student Sign In"
                : selectedRole === "volunteer"
                ? "Volunteer Portal Sign In"
                : "Administrator Sign In"}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {selectedRole === "student"
                ? authMode === "signup"
                  ? "Create your student profile to access events, QR passes, and certificates."
                  : "Access your student event registrations, attendance passes, and certificates."
                : selectedRole === "volunteer"
                ? "Enter your credentials provisioned by the Administrator."
                : "Secure portal access for Lead Administrator."}
            </p>
          </div>

          {/* 3-Role Switcher Tabs */}
          <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-gray-100/80 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange("student")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                selectedRole === "student"
                  ? "bg-white text-[#7040d0] shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange("volunteer")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                selectedRole === "volunteer"
                  ? "bg-white text-[#7040d0] shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users size={15} />
              <span>Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange("admin")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                selectedRole === "admin"
                  ? "bg-white text-[#7040d0] shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          </div>

          {/* Sub-tabs for Student (Sign In / Register Account) */}
          {selectedRole === "student" && (
            <div className="mt-4 flex border-b border-gray-100 pb-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className={`pb-1 border-b-2 transition-colors ${
                  authMode === "login"
                    ? "border-[#7040d0] text-[#7040d0]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Sign In to Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className={`pb-1 border-b-2 transition-colors ${
                  authMode === "signup"
                    ? "border-[#7040d0] text-[#7040d0]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                + Register New Student
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* FORM: Sign In Mode (Student, Volunteer, Admin) */}
          {authMode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  {selectedRole === "student"
                    ? "Enrollment No., College Email or Student ID"
                    : selectedRole === "volunteer"
                    ? "Volunteer Enrollment No., Email or ID"
                    : "Administrator Email or Admin ID"}
                </label>
                <div className="relative flex items-center">
                  <Mail
                    size={16}
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                    placeholder={
                      selectedRole === "student"
                        ? "e.g. 220130107054 or jeny@vgec.ac.in"
                        : selectedRole === "volunteer"
                        ? "e.g. 220130108002 or dhruvi@vgec.ac.in"
                        : "e.g. ishika@vgec.ac.in or AD001"
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-10 pr-4 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white focus:ring-2 focus:ring-[#7040d0]/15 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    (Demo: any password or quick account)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-10 pr-10 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white focus:ring-2 focus:ring-[#7040d0]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#211653] hover:bg-[#342278] py-3 text-xs font-semibold text-white shadow-md active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORM: Student Registration Mode */
            <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={15} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={signupData.fullName}
                    onChange={handleSignupChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 pl-9 pr-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* College Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  College Email <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    placeholder="e.g. rahul.sharma@vgec.ac.in"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 pl-9 pr-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Department & Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Branch / Dept
                  </label>
                  <select
                    name="department"
                    value={signupData.department}
                    onChange={handleSignupChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 px-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white"
                  >
                    <option value="IT">IT (Information Tech)</option>
                    <option value="CE">CE (Computer Eng)</option>
                    <option value="ICT">ICT</option>
                    <option value="EC">EC (Electronics)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Academic Year
                  </label>
                  <select
                    name="year"
                    value={signupData.year}
                    onChange={handleSignupChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 px-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white"
                  >
                    <option value={1}>1st Year (Sem 1-2)</option>
                    <option value={2}>2nd Year (Sem 3-4)</option>
                    <option value={3}>3rd Year (Sem 5-6)</option>
                    <option value={4}>4th Year (Sem 7-8)</option>
                  </select>
                </div>
              </div>

              {/* Enrollment No & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Enrollment No.
                  </label>
                  <input
                    type="text"
                    name="enrollmentNo"
                    value={signupData.enrollmentNo}
                    onChange={handleSignupChange}
                    placeholder="220130107..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 px-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={signupData.phone}
                    onChange={handleSignupChange}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 px-3 text-xs font-medium text-gray-800 outline-none focus:border-[#7040d0] focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7040d0] hover:bg-[#5a32ab] py-3 text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Complete Registration & Enter Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Information Callouts for Volunteer and Admin */}
          {selectedRole === "volunteer" && (
            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 text-xs text-purple-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#7040d0]" />
                <span>Volunteer Account Policy:</span>
              </p>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Volunteer accounts are centrally created and managed by the Administrator. If you do not have credentials yet, please coordinate with your TCF Lead Admin.
              </p>
            </div>
          )}

          {selectedRole === "admin" && (
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                <span>Lead Administrator Access:</span>
              </p>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                AXON is managed by ONE single designated Administrator. Access is restricted to authorized TCF governance.
              </p>
            </div>
          )}

          {/* 1-Click Quick Demo Accounts (Viva & Evaluator Friendly) */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <Sparkles size={13} className="text-[#7040d0]" />
                <span>1-Click Test Accounts ({selectedRole}):</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Click to authenticate instantly
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedRole === "student" &&
                demoStudents.slice(0, 6).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(st)}
                    className="rounded-xl border border-gray-200/90 bg-gray-50/80 p-2 text-left hover:bg-purple-50/70 hover:border-purple-200 transition-colors text-xs"
                  >
                    <p className="font-bold text-gray-800 truncate">{st.fullName}</p>
                    <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                      {st.id} · {st.department} Yr {st.year}
                    </p>
                  </button>
                ))}

              {selectedRole === "volunteer" &&
                demoVolunteers.map((vl) => (
                  <button
                    key={vl.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(vl)}
                    className="rounded-xl border border-gray-200/90 bg-gray-50/80 p-2 text-left hover:bg-purple-50/70 hover:border-purple-200 transition-colors text-xs"
                  >
                    <p className="font-bold text-gray-800 truncate">{vl.fullName}</p>
                    <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                      {vl.id} · {vl.designation || vl.committee}
                    </p>
                  </button>
                ))}

              {selectedRole === "admin" && demoAdmin && (
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(demoAdmin)}
                  className="col-span-2 sm:col-span-3 rounded-xl border border-purple-200 bg-purple-50/80 p-2.5 text-left hover:bg-purple-100/70 transition-colors text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">{demoAdmin.fullName}</p>
                    <p className="text-[11px] text-[#7040d0] font-medium mt-0.5">
                      {demoAdmin.id} • {demoAdmin.designation} (TCF Lead Admin)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#7040d0] text-white text-[11px] font-semibold">
                    Sign In as Admin →
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-lg text-center text-xs text-gray-400">
        <p>© 2026-2027 AXON • The Cyber Force (TCF) VGEC. All rights reserved.</p>
      </footer>
    </div>
  );
}
