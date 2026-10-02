import { useState, useEffect, useMemo } from "react";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

import { users } from "../../mockData";
import api from "../../services/api.js";

function Profile() {
  const [liveProfile, setLiveProfile] = useState(null);

  useEffect(() => {
    api.get("/users/profile")
      .then((res) => {
        if (res && res.user) {
          setLiveProfile(res.user);
        }
      })
      .catch(() => {});
  }, []);

  // Current active volunteer user
  const currentVolunteer = useMemo(() => {
    if (liveProfile) {
      return {
        id: liveProfile._id || liveProfile.id,
        fullName: liveProfile.fullName || "Volunteer",
        enrollmentNo: liveProfile.enrollmentNumber || liveProfile.enrollmentNo || "220130107000",
        email: liveProfile.email || "volunteer@vgec.ac.in",
        phone: liveProfile.phoneNumber || liveProfile.phone || "9876543210",
        department: liveProfile.department || "IT",
        year: liveProfile.batch ? 3 : 3,
        semester: 5,
        designation: liveProfile.role === "volunteer" ? "Volunteer Coordinator" : "President",
        isActive: liveProfile.accountStatus !== "suspended",
      };
    }

    try {
      const stored = localStorage.getItem("axon_auth_user") || localStorage.getItem("axon_volunteer_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === "volunteer" || parsed.email?.includes("vgec.ac.in"))) {
          return {
            id: parsed.id || parsed._id || "VL002",
            fullName: parsed.fullName || parsed.name || "Volunteer",
            enrollmentNo: parsed.enrollmentNumber || parsed.enrollmentNo || "220130108002",
            email: parsed.email || "volunteer@vgec.ac.in",
            phone: parsed.phoneNumber || parsed.phone || "9876543221",
            department: parsed.department || "IT",
            year: 3,
            semester: 5,
            designation: "Volunteer Coordinator",
            isActive: true,
          };
        }
      }
    } catch (e) {}

    return (
      users.find((u) => u.id === "VL002") ||
      users.find((u) => u.role === "volunteer") || {
        id: "VL002",
        fullName: "Preyas Shah",
        enrollmentNo: "220130108002",
        email: "preyas@vgec.ac.in",
        phone: "9876543221",
        department: "IT",
        year: 3,
        semester: 5,
        designation: "President",
        isActive: true,
      }
    );
  }, [liveProfile]);

  // Admin-assigned designation (e.g., President, Vice President)
  const volunteerRoleTitle = currentVolunteer.designation || "Volunteer Coordinator";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#24154f]">Volunteer Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your administrative profile details, academic records, and assigned club role.
        </p>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7040d0] to-[#24154f] text-2xl font-bold text-white shadow-md">
                {currentVolunteer.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2) || "DP"}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white ring-2 ring-white"
                title="Active Volunteer"
              >
                <CheckCircle2 size={14} />
              </span>
            </div>

            {/* Basic Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentVolunteer.fullName}
                </h2>
                <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
                  {volunteerRoleTitle}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Enrollment: <span className="font-mono font-medium text-gray-700">{currentVolunteer.enrollmentNo}</span>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-purple-600" />
                  The Cyber Force (TCF)
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-600" />
                  Active Verified Account
                </span>
              </div>
            </div>
          </div>

          {/* Admin Managed Badge */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3.5 sm:text-right sm:max-w-xs">
            <p className="text-xs font-semibold text-purple-900">Admin Managed Profile</p>
            <p className="mt-0.5 text-[11px] text-purple-700">
              Profile details and assigned roles are managed directly by the Administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Academic & Student Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Academic & Account Details</h3>
              <p className="text-xs text-gray-500">Official college and student credentials</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <User size={15} className="text-gray-400" />
                Full Name
              </span>
              <span className="font-semibold text-gray-800">
                {currentVolunteer.fullName}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Hash size={15} className="text-gray-400" />
                Enrollment Number
              </span>
              <span className="font-mono font-semibold text-gray-800">
                {currentVolunteer.enrollmentNo}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <BookOpen size={15} className="text-gray-400" />
                Branch / Department
              </span>
              <span className="font-medium text-gray-800">
                {currentVolunteer.department === "IT"
                  ? "Information Technology (IT)"
                  : currentVolunteer.department === "CE"
                  ? "Computer Engineering (CE)"
                  : currentVolunteer.department}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Calendar size={15} className="text-gray-400" />
                Year & Semester
              </span>
              <span className="font-medium text-gray-800">
                Year {currentVolunteer.year || 3} · Semester {currentVolunteer.semester || 5}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Building2 size={15} className="text-gray-400" />
                Institute
              </span>
              <span className="font-medium text-gray-800">
                VGEC, Chandkheda
              </span>
            </div>
          </div>
        </div>

        {/* 2. Volunteer Role & Contact Information Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Volunteer Role & Contact</h3>
              <p className="text-xs text-gray-500">Assigned club responsibilities and contact info</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Award size={15} className="text-gray-400" />
                Assigned Role / Designation
              </span>
              <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                {volunteerRoleTitle}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Building2 size={15} className="text-gray-400" />
                Club / Organization
              </span>
              <span className="font-medium text-gray-800">
                The Cyber Force (TCF)
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Mail size={15} className="text-gray-400" />
                Official Email
              </span>
              <span className="font-medium text-gray-800 break-all">
                {currentVolunteer.email}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <Phone size={15} className="text-gray-400" />
                Contact Phone
              </span>
              <span className="font-medium text-gray-800">
                +91 {currentVolunteer.phone}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-gray-500 text-xs">
                <ShieldCheck size={15} className="text-gray-400" />
                Role Status
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-green-700 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active Member
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
