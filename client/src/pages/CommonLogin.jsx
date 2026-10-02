import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { loginUser, registerStudent } from "../services/authService";

export default function CommonLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  // Active tab: 'signin' | 'register'
  const [activeTab, setActiveTab] = useState("signin");

  // ==========================================
  // SIGN IN STATE
  // ==========================================
  const [signInData, setSignInData] = useState({
    enrollmentNo: "",
    email: "",
  });

  // ==========================================
  // REGISTER STATE
  // ==========================================
  const [registerData, setRegisterData] = useState({
    fullName: "",
    enrollmentNo: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    department: "IT",
    courseType: "Regular", // "Regular" | "D2D"
    batch: "2024-2028",
    year: "3rd Year",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Dynamic Batch & Year Options based on Course Type (Regular vs D2D)
  const academicOptions = useMemo(() => {
    if (registerData.courseType === "D2D") {
      return {
        years: ["2nd Year", "3rd Year", "4th Year"],
        batches: [
          { value: "2025-2028", label: "2025-2028 (2nd Year)" },
          { value: "2024-2027", label: "2024-2027 (3rd Year)" },
          { value: "2023-2026", label: "2023-2026 (4th Year)" },
        ],
      };
    }
    // Regular 4-year degree
    return {
      years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      batches: [
        { value: "2026-2030", label: "2026-2030 (1st Year)" },
        { value: "2025-2029", label: "2025-2029 (2nd Year)" },
        { value: "2024-2028", label: "2024-2028 (3rd Year)" },
        { value: "2023-2027", label: "2023-2027 (4th Year)" },
      ],
    };
  }, [registerData.courseType]);

  const getDestinationPath = (userRole) => {
    if (redirectParam) return redirectParam;
    if (userRole === "student") return "/dashboard";
    if (userRole === "volunteer") return "/volunteer";
    if (userRole === "admin") return "/admin";
    return "/dashboard";
  };

  // Switch between Sign In and Register tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccessMsg("");
  };

  // ==========================================
  // SIGN IN SUBMISSION & VALIDATION
  // ==========================================
  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const enroll = signInData.enrollmentNo.trim();
    const email = signInData.email.trim();

    // Frontend validation: at least one identifier must be provided
    if (!enroll && !email) {
      setError("Please enter your Enrollment Number or Email ID.");
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const user = loginUser({
        enrollmentNo: enroll,
        email: email,
      });
      navigate(getDestinationPath(user.role));
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your details.");
      setLoading(false);
    }
  };

  // ==========================================
  // REGISTER SUBMISSION & VALIDATION
  // ==========================================
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setError("");

    if (name === "courseType") {
      const newCourseType = value;
      const defaultYear = newCourseType === "D2D" ? "2nd Year" : "3rd Year";
      const defaultBatch =
        newCourseType === "D2D" ? "2024-2027" : "2024-2028";

      setRegisterData((prev) => ({
        ...prev,
        courseType: newCourseType,
        year: defaultYear,
        batch: defaultBatch,
      }));
      return;
    }

    if (name === "year") {
      setRegisterData((prev) => {
        let matchedBatch = prev.batch;
        if (prev.courseType === "D2D") {
          if (value === "2nd Year") matchedBatch = "2025-2028";
          else if (value === "3rd Year") matchedBatch = "2024-2027";
          else if (value === "4th Year") matchedBatch = "2023-2026";
        } else {
          if (value === "1st Year") matchedBatch = "2026-2030";
          else if (value === "2nd Year") matchedBatch = "2025-2029";
          else if (value === "3rd Year") matchedBatch = "2024-2028";
          else if (value === "4th Year") matchedBatch = "2023-2027";
        }
        return {
          ...prev,
          year: value,
          batch: matchedBatch,
        };
      });
      return;
    }

    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetOtp = () => {
    setError("");
    const email = registerData.email.trim();
    if (!email) {
      setError("Please enter your college Email ID to receive the OTP.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setOtpSent(true);
    // Simulate OTP generation and auto-fill for frictionless UX
    const sampleOtp = "849201";
    setRegisterData((prev) => ({ ...prev, otp: sampleOtp }));
    setSuccessMsg(`OTP sent to ${email}! (Test OTP: ${sampleOtp})`);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const {
      fullName,
      enrollmentNo,
      email,
      otp,
      password,
      confirmPassword,
      department,
      courseType,
      batch,
      year,
      phone,
    } = registerData;

    // Strict Frontend Validations
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError("Please enter your full name (minimum 3 characters).");
      return;
    }

    if (!enrollmentNo.trim()) {
      setError("Please enter your enrollment number.");
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid college email address.");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    setLoading(true);
    try {
      const yearNumber = parseInt(year) || 3;
      const newStudent = registerStudent({
        fullName: fullName.trim(),
        enrollmentNo: enrollmentNo.trim(),
        email: email.trim(),
        password,
        department,
        courseType,
        batch,
        year: yearNumber,
        phone: phone.trim(),
      });

      navigate(getDestinationPath(newStudent.role));
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased text-gray-900">
      {/* Central Login / Register Card */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-gray-100 shadow-xl shadow-purple-900/5 p-7 sm:p-9 transition-all">
        {/* Sign In Header Icon Badge (Shown on Sign In tab as in Mockup) */}
        {activeTab === "signin" && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f2fe] text-[#7040d0]">
            <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1236]">
            {activeTab === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="mt-1.5 text-xs text-gray-500 font-normal">
            {activeTab === "signin"
              ? "Access your event registrations, attendance and certificates."
              : "Register to access the AXON student portal."}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 mb-6 flex items-center gap-6 border-b border-gray-100/80 pb-0">
          <button
            type="button"
            onClick={() => handleTabSwitch("signin")}
            className={`pb-2.5 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "signin"
                ? "text-[#7040d0]"
                : "text-gray-500 hover:text-gray-800 font-medium"
            }`}
          >
            Sign In
            {activeTab === "signin" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#7040d0] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("register")}
            className={`pb-2.5 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "register"
                ? "text-[#7040d0]"
                : "text-gray-500 hover:text-gray-800 font-medium"
            }`}
          >
            Register
            {activeTab === "register" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#7040d0] rounded-full" />
            )}
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50/90 border border-red-200/80 p-3 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-purple-50 border border-purple-200/80 p-3 text-xs text-[#7040d0]">
            <CheckCircle2 className="w-4 h-4 text-[#7040d0] shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: SIGN IN (Pixel-perfect matching Image 1)           */}
        {/* ======================================================== */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Enrollment Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Enrollment Number
              </label>
              <input
                type="text"
                name="enrollmentNo"
                value={signInData.enrollmentNo}
                onChange={handleSignInChange}
                placeholder="Enter your enrollment number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
              />
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={signInData.email}
                  onChange={handleSignInChange}
                  placeholder="yourname@vgec.ac.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#211653] hover:bg-[#180f3e] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-950/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REGISTER (Pixel-perfect matching Image 2 + Batch) */}
        {/* ======================================================== */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={registerData.fullName}
                onChange={handleRegisterChange}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
              />
            </div>

            {/* Enrollment Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                name="enrollmentNo"
                value={registerData.enrollmentNo}
                onChange={handleRegisterChange}
                placeholder="Enter your enrollment number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
              />
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Email ID
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="yourname@vgec.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
              />
            </div>

            {/* Email OTP */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Email OTP
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="otp"
                  value={registerData.otp}
                  onChange={handleRegisterChange}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleGetOtp}
                  className="px-4 py-2.5 bg-[#f4effe] hover:bg-[#ede3fd] text-[#7040d0] rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  {otpSent ? "Resend OTP" : "Get OTP"}
                </button>
              </div>
            </div>

            {/* Password & Confirm Password (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Password"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
                />
              </div>
            </div>

            {/* Department & Course Type (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Department
                </label>
                <div className="relative">
                  <select
                    name="department"
                    value={registerData.department}
                    onChange={handleRegisterChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors cursor-pointer"
                  >
                    <option value="IT">IT</option>
                    <option value="CE">CE</option>
                    <option value="ICT">ICT</option>
                    <option value="EC">EC</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Course Type
                </label>
                <div className="relative">
                  <select
                    name="courseType"
                    value={registerData.courseType}
                    onChange={handleRegisterChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors cursor-pointer"
                  >
                    <option value="Regular">Regular</option>
                    <option value="D2D">D2D</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Batch & Year (2 Columns - Batch placed before Year box) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Batch
                </label>
                <div className="relative">
                  <select
                    name="batch"
                    value={registerData.batch}
                    onChange={handleRegisterChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors cursor-pointer"
                  >
                    {academicOptions.batches.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.value}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Year
                </label>
                <div className="relative">
                  <select
                    name="year"
                    value={registerData.year}
                    onChange={handleRegisterChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors cursor-pointer"
                  >
                    {academicOptions.years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={registerData.phone}
                onChange={handleRegisterChange}
                placeholder="10-digit number"
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7040d0] transition-colors"
              />
            </div>

            {/* Create Account Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#7040d0] hover:bg-[#6030c0] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Footer Brand Credit */}
        <div className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#7040d0]" />
          <span>AXON • The Cyber Force (TCF), VGEC</span>
        </div>
      </div>
    </div>
  );
}
