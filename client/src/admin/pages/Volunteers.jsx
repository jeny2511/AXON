import { useEffect, useState, useMemo } from "react";
import {
  Search,
  X,
  UserPlus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Camera,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { users } from "../../mockData";
import api from "../../services/api";

const DEPARTMENTS = [
  "IT",
  "CS",
  "CE",
  "ICT",
  "EC",
  "AI & DS",
  "Mechanical",
  "Civil",
  "Chemical",
  "Automobile",
];

const COMMITTEE_POSITIONS = [
  "Core Team Lead",
  "Technical Committee",
  "Photography & Media Committee",
  "Event Management Committee",
  "Publicity & Promotion Committee",
  "Registration Committee",
  "Design & Creative Committee",
  "Social Media Committee",
  "Content & Documentation Committee",
  "Hospitality Committee",
  "Logistics Committee",
  "Volunteer Member",
];

// Academic Options helper matching Student Registration logic
function getAcademicOptions(admissionType) {
  if (admissionType?.toLowerCase() === "d2d") {
    return {
      years: [
        { value: "2", label: "2nd Year" },
        { value: "3", label: "3rd Year" },
        { value: "4", label: "4th Year" },
      ],
      batches: [
        { value: "2025 - 2028", label: "2025 - 2028", year: "2" },
        { value: "2024 - 2027", label: "2024 - 2027", year: "3" },
        { value: "2023 - 2026", label: "2023 - 2026", year: "4" },
      ],
    };
  }
  return {
    years: [
      { value: "1", label: "1st Year" },
      { value: "2", label: "2nd Year" },
      { value: "3", label: "3rd Year" },
      { value: "4", label: "4th Year" },
    ],
    batches: [
      { value: "2026 - 2030", label: "2026 - 2030", year: "1" },
      { value: "2025 - 2029", label: "2025 - 2029", year: "2" },
      { value: "2024 - 2028", label: "2024 - 2028", year: "3" },
      { value: "2023 - 2027", label: "2023 - 2027", year: "4" },
    ],
  };
}

// Helper to format year label
function formatYearLabel(yearVal) {
  if (!yearVal) return "1st Year";
  const num = Number(yearVal);
  if (num === 1) return "1st Year";
  if (num === 2) return "2nd Year";
  if (num === 3) return "3rd Year";
  if (num === 4) return "4th Year";
  return String(yearVal).includes("Year") ? yearVal : `${yearVal}th Year`;
}

const INITIAL_ADD_FORM = {
  fullName: "",
  enrollmentNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  department: "IT",
  admissionType: "regular",
  batch: "2026 - 2030",
  year: "1",
  phone: "",
  committeePosition: "Volunteer Member",
  profilePhoto: "",
};

function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");

  // Add Volunteer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState(INITIAL_ADD_FORM);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
  const [addError, setAddError] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Modal State
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    enrollmentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    admissionType: "regular",
    batch: "2026 - 2030",
    year: "1",
    phone: "",
    committeePosition: "",
    profilePhoto: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Modal State
  const [deletingVolunteer, setDeletingVolunteer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Notification
  const [notification, setNotification] = useState(null);

  // Dynamic Academic Options for Add & Edit Modals
  const addAcademicOptions = useMemo(() => {
    return getAcademicOptions(addFormData.admissionType);
  }, [addFormData.admissionType]);

  const editAcademicOptions = useMemo(() => {
    return getAcademicOptions(editFormData.admissionType);
  }, [editFormData.admissionType]);

  // Load volunteers from mockData + localStorage
  const loadVolunteers = () => {
    const mockVolunteers = users
      .filter((user) => user.role === "volunteer")
      .map((u) => ({
        ...u,
        enrollmentNumber: u.enrollmentNumber || u.enrollmentNo || "",
        phoneNumber: u.phoneNumber || u.phone || "",
        admissionType: u.admissionType || "regular",
        batch: u.batch || "2024 - 2028",
        committeePosition: u.committeePosition || u.committee || "Volunteer Member",
        year: u.year || u.academicYear || 1,
      }));

    const addedVolunteers =
      JSON.parse(localStorage.getItem("axonVolunteers")) || [];

    // Deduplicate by ID / enrollment
    const map = new Map();
    [...mockVolunteers, ...addedVolunteers].forEach((vol) => {
      const key = vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      if (key) {
        map.set(key, {
          ...vol,
          enrollmentNumber: vol.enrollmentNumber || vol.enrollmentNo || "",
          phone: vol.phone || vol.phoneNumber || "",
          phoneNumber: vol.phoneNumber || vol.phone || "",
          committeePosition: vol.committeePosition || vol.committee || "Volunteer Member",
          committee: vol.committee || vol.committeePosition || "Volunteer Member",
          batch: vol.batch || "2024 - 2028",
          admissionType: vol.admissionType || "regular",
        });
      }
    });

    setVolunteers(Array.from(map.values()));
  };

  useEffect(() => {
    loadVolunteers();

    const handleSync = () => loadVolunteers();
    window.addEventListener("axon-volunteers-change", handleSync);
    return () => window.removeEventListener("axon-volunteers-change", handleSync);
  }, []);

  // Filter volunteers by search query
  const filteredVolunteers = useMemo(() => {
    if (!search.trim()) return volunteers;
    const q = search.trim().toLowerCase();
    return volunteers.filter(
      (v) =>
        v.fullName?.toLowerCase().includes(q) ||
        v.department?.toLowerCase().includes(q) ||
        (v.committeePosition || v.committee)?.toLowerCase().includes(q) ||
        String(v.year)?.includes(q) ||
        (v.enrollmentNumber || v.enrollmentNo)?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
    );
  }, [volunteers, search]);

  // ----------------------------------------------------
  // ADD VOLUNTEER HANDLERS
  // ----------------------------------------------------
  const handleOpenAddModal = () => {
    setAddFormData(INITIAL_ADD_FORM);
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setAddError("");
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddError("");
  };

  const handleResetAdd = () => {
    setAddFormData(INITIAL_ADD_FORM);
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setAddError("");
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    if (addError) setAddError("");

    if (name === "admissionType") {
      const isD2D = value.toLowerCase() === "d2d";
      const defaultYear = isD2D ? "2" : "1";
      const defaultBatch = isD2D ? "2025 - 2028" : "2026 - 2030";
      setAddFormData((prev) => ({
        ...prev,
        admissionType: value,
        year: defaultYear,
        batch: defaultBatch,
      }));
      return;
    }

    if (name === "year") {
      const isD2D = addFormData.admissionType?.toLowerCase() === "d2d";
      let matchedBatch = addFormData.batch;
      if (isD2D) {
        if (value === "2") matchedBatch = "2025 - 2028";
        else if (value === "3") matchedBatch = "2024 - 2027";
        else if (value === "4") matchedBatch = "2023 - 2026";
      } else {
        if (value === "1") matchedBatch = "2026 - 2030";
        else if (value === "2") matchedBatch = "2025 - 2029";
        else if (value === "3") matchedBatch = "2024 - 2028";
        else if (value === "4") matchedBatch = "2023 - 2027";
      }
      setAddFormData((prev) => ({
        ...prev,
        year: value,
        batch: matchedBatch,
      }));
      return;
    }

    if (name === "batch") {
      const isD2D = addFormData.admissionType?.toLowerCase() === "d2d";
      let matchedYear = addFormData.year;
      if (isD2D) {
        if (value.includes("2025")) matchedYear = "2";
        else if (value.includes("2024")) matchedYear = "3";
        else if (value.includes("2023")) matchedYear = "4";
      } else {
        if (value.includes("2026")) matchedYear = "1";
        else if (value.includes("2025")) matchedYear = "2";
        else if (value.includes("2024")) matchedYear = "3";
        else if (value.includes("2023")) matchedYear = "4";
      }
      setAddFormData((prev) => ({
        ...prev,
        batch: value,
        year: matchedYear,
      }));
      return;
    }

    setAddFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAddError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAddError("Profile photo must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAddFormData((prev) => ({
        ...prev,
        profilePhoto: reader.result,
      }));
      setAddError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAddRemovePhoto = () => {
    setAddFormData((prev) => ({
      ...prev,
      profilePhoto: "",
    }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    setIsSubmittingAdd(true);

    try {
      // 1. Validation
      if (!addFormData.fullName.trim()) {
        throw new Error("Full Name is required.");
      }
      if (!addFormData.enrollmentNumber.trim()) {
        throw new Error("Enrollment Number is required.");
      }
      if (!addFormData.email.trim()) {
        throw new Error("Email ID is required.");
      }
      if (!addFormData.password) {
        throw new Error("Password is required.");
      }
      if (addFormData.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      if (addFormData.password !== addFormData.confirmPassword) {
        throw new Error("Passwords do not match. Please recheck Confirm Password.");
      }
      if (!addFormData.department) {
        throw new Error("Please select a Department.");
      }
      if (!addFormData.admissionType) {
        throw new Error("Please select Regular / D2D.");
      }
      if (!addFormData.batch) {
        throw new Error("Please select a Batch.");
      }
      if (!addFormData.year) {
        throw new Error("Please select Academic Year.");
      }
      if (!addFormData.phone.trim()) {
        throw new Error("Phone Number is required.");
      }
      if (!/^[0-9]{10}$/.test(addFormData.phone.trim().replace(/\D/g, ""))) {
        throw new Error("Please enter a valid 10-digit Phone Number.");
      }
      if (!addFormData.committeePosition) {
        throw new Error("Please select a Committee Position.");
      }

      const formattedEnrollment = addFormData.enrollmentNumber.trim().toUpperCase();
      const formattedEmail = addFormData.email.trim().toLowerCase();

      // Check duplicates
      const isDuplicate = volunteers.some(
        (v) =>
          (v.enrollmentNumber && v.enrollmentNumber.toUpperCase() === formattedEnrollment) ||
          (v.enrollmentNo && v.enrollmentNo.toUpperCase() === formattedEnrollment) ||
          (v.email && v.email.toLowerCase() === formattedEmail)
      );

      if (isDuplicate) {
        throw new Error("A volunteer with this Enrollment Number or Email ID already exists.");
      }

      const newVolunteerRecord = {
        id: `VOL${Date.now()}`,
        _id: `VOL${Date.now()}`,
        fullName: addFormData.fullName.trim(),
        name: addFormData.fullName.trim(),
        enrollmentNumber: formattedEnrollment,
        enrollmentNo: formattedEnrollment,
        email: formattedEmail,
        department: addFormData.department,
        admissionType: addFormData.admissionType,
        batch: addFormData.batch,
        year: Number(addFormData.year),
        academicYear: Number(addFormData.year),
        phone: addFormData.phone.trim(),
        phoneNumber: addFormData.phone.trim(),
        committee: addFormData.committeePosition,
        committeePosition: addFormData.committeePosition,
        role: "volunteer",
        profilePhoto: addFormData.profilePhoto || "/assets/images/profile/default.jpg",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      // Persist to local storage
      const existingCustom =
        JSON.parse(localStorage.getItem("axonVolunteers")) || [];
      const updatedCustom = [newVolunteerRecord, ...existingCustom];
      localStorage.setItem("axonVolunteers", JSON.stringify(updatedCustom));

      // Update state
      setVolunteers([newVolunteerRecord, ...volunteers]);
      window.dispatchEvent(new Event("axon-volunteers-change"));

      // Try backend sync
      try {
        await api.post("/auth/register", {
          name: newVolunteerRecord.fullName,
          fullName: newVolunteerRecord.fullName,
          email: newVolunteerRecord.email,
          password: addFormData.password,
          role: "volunteer",
          department: newVolunteerRecord.department,
          admissionType: newVolunteerRecord.admissionType,
          year: newVolunteerRecord.year,
          batch: newVolunteerRecord.batch,
          enrollmentNumber: newVolunteerRecord.enrollmentNumber,
          phoneNumber: newVolunteerRecord.phoneNumber,
          committeePosition: newVolunteerRecord.committeePosition,
          profilePhoto: newVolunteerRecord.profilePhoto,
        });
      } catch (backendErr) {
        console.warn("Backend volunteer register fallback:", backendErr?.message || backendErr);
      }

      setIsAddModalOpen(false);
      setNotification({
        type: "success",
        message: `Volunteer "${newVolunteerRecord.fullName}" added successfully!`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setAddError(err.message || "Failed to add volunteer.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // ----------------------------------------------------
  // EDIT VOLUNTEER HANDLERS
  // ----------------------------------------------------
  const handleOpenEdit = (volunteer) => {
    setEditingVolunteer(volunteer);
    setEditError("");
    setEditFormData({
      fullName: volunteer.fullName || "",
      enrollmentNumber: volunteer.enrollmentNumber || volunteer.enrollmentNo || "",
      email: volunteer.email || "",
      password: "",
      confirmPassword: "",
      department: volunteer.department || "IT",
      admissionType: (volunteer.admissionType || "regular").toLowerCase(),
      batch: volunteer.batch || "2024 - 2028",
      year: String(volunteer.year || volunteer.academicYear || "1"),
      phone: volunteer.phone || volunteer.phoneNumber || "",
      committeePosition:
        volunteer.committeePosition || volunteer.committee || "Volunteer Member",
      profilePhoto:
        volunteer.profilePhoto && !volunteer.profilePhoto.includes("default.jpg")
          ? volunteer.profilePhoto
          : "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (editError) setEditError("");

    if (name === "admissionType") {
      const isD2D = value.toLowerCase() === "d2d";
      const defaultYear = isD2D ? "2" : "1";
      const defaultBatch = isD2D ? "2025 - 2028" : "2026 - 2030";
      setEditFormData((prev) => ({
        ...prev,
        admissionType: value,
        year: defaultYear,
        batch: defaultBatch,
      }));
      return;
    }

    if (name === "year") {
      const isD2D = editFormData.admissionType?.toLowerCase() === "d2d";
      let matchedBatch = editFormData.batch;
      if (isD2D) {
        if (value === "2") matchedBatch = "2025 - 2028";
        else if (value === "3") matchedBatch = "2024 - 2027";
        else if (value === "4") matchedBatch = "2023 - 2026";
      } else {
        if (value === "1") matchedBatch = "2026 - 2030";
        else if (value === "2") matchedBatch = "2025 - 2029";
        else if (value === "3") matchedBatch = "2024 - 2028";
        else if (value === "4") matchedBatch = "2023 - 2027";
      }
      setEditFormData((prev) => ({
        ...prev,
        year: value,
        batch: matchedBatch,
      }));
      return;
    }

    if (name === "batch") {
      const isD2D = editFormData.admissionType?.toLowerCase() === "d2d";
      let matchedYear = editFormData.year;
      if (isD2D) {
        if (value.includes("2025")) matchedYear = "2";
        else if (value.includes("2024")) matchedYear = "3";
        else if (value.includes("2023")) matchedYear = "4";
      } else {
        if (value.includes("2026")) matchedYear = "1";
        else if (value.includes("2025")) matchedYear = "2";
        else if (value.includes("2024")) matchedYear = "3";
        else if (value.includes("2023")) matchedYear = "4";
      }
      setEditFormData((prev) => ({
        ...prev,
        batch: value,
        year: matchedYear,
      }));
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setEditError("Profile photo must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData((prev) => ({
        ...prev,
        profilePhoto: reader.result,
      }));
      setEditError("");
    };
    reader.readAsDataURL(file);
  };

  const handleEditRemovePhoto = () => {
    setEditFormData((prev) => ({
      ...prev,
      profilePhoto: "",
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingVolunteer) return;
    setEditError("");

    if (!editFormData.fullName.trim()) {
      setEditError("Full Name is required.");
      return;
    }
    if (!editFormData.enrollmentNumber.trim()) {
      setEditError("Enrollment Number is required.");
      return;
    }
    if (!editFormData.email.trim()) {
      setEditError("Email ID is required.");
      return;
    }
    if (editFormData.password && editFormData.password.length < 6) {
      setEditError("Password must be at least 6 characters.");
      return;
    }
    if (
      editFormData.password &&
      editFormData.password !== editFormData.confirmPassword
    ) {
      setEditError("Passwords do not match. Please recheck Confirm Password.");
      return;
    }
    if (!editFormData.department) {
      setEditError("Please select a Department.");
      return;
    }
    if (!editFormData.admissionType) {
      setEditError("Please select Regular / D2D.");
      return;
    }
    if (!editFormData.batch) {
      setEditError("Please select a Batch.");
      return;
    }
    if (!editFormData.year) {
      setEditError("Please select Academic Year.");
      return;
    }
    if (!editFormData.phone.trim()) {
      setEditError("Phone Number is required.");
      return;
    }
    if (!/^[0-9]{10}$/.test(editFormData.phone.trim().replace(/\D/g, ""))) {
      setEditError("Please enter a valid 10-digit Phone Number.");
      return;
    }
    if (!editFormData.committeePosition) {
      setEditError("Please select a Committee Position.");
      return;
    }

    const targetKey =
      editingVolunteer.id ||
      editingVolunteer._id ||
      editingVolunteer.enrollmentNumber ||
      editingVolunteer.enrollmentNo;

    const updatedVolunteerRecord = {
      ...editingVolunteer,
      fullName: editFormData.fullName.trim(),
      enrollmentNumber: editFormData.enrollmentNumber.trim().toUpperCase(),
      enrollmentNo: editFormData.enrollmentNumber.trim().toUpperCase(),
      email: editFormData.email.trim().toLowerCase(),
      department: editFormData.department,
      admissionType: editFormData.admissionType,
      batch: editFormData.batch,
      year: Number(editFormData.year),
      academicYear: Number(editFormData.year),
      phone: editFormData.phone.trim(),
      phoneNumber: editFormData.phone.trim(),
      committee: editFormData.committeePosition,
      committeePosition: editFormData.committeePosition,
      profilePhoto:
        editFormData.profilePhoto ||
        editingVolunteer.profilePhoto ||
        "/assets/images/profile/default.jpg",
    };

    const updatedList = volunteers.map((vol) => {
      const currentKey =
        vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      return currentKey === targetKey ? updatedVolunteerRecord : vol;
    });

    setVolunteers(updatedList);

    // Persist to localStorage
    const customVolunteers =
      JSON.parse(localStorage.getItem("axonVolunteers")) || [];
    const existsInCustom = customVolunteers.some((vol) => {
      const currentKey =
        vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      return currentKey === targetKey;
    });

    let updatedCustom;
    if (existsInCustom) {
      updatedCustom = customVolunteers.map((vol) => {
        const currentKey =
          vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
        return currentKey === targetKey ? updatedVolunteerRecord : vol;
      });
    } else {
      updatedCustom = [...customVolunteers, updatedVolunteerRecord];
    }

    localStorage.setItem("axonVolunteers", JSON.stringify(updatedCustom));
    window.dispatchEvent(new Event("axon-volunteers-change"));

    // Sync to backend if ID exists
    const backendId = editingVolunteer._id || editingVolunteer.id;
    if (backendId) {
      try {
        const payload = {
          fullName: updatedVolunteerRecord.fullName,
          enrollmentNumber: updatedVolunteerRecord.enrollmentNumber,
          email: updatedVolunteerRecord.email,
          department: updatedVolunteerRecord.department,
          admissionType: updatedVolunteerRecord.admissionType,
          batch: updatedVolunteerRecord.batch,
          year: updatedVolunteerRecord.year,
          phoneNumber: updatedVolunteerRecord.phoneNumber,
          committeePosition: updatedVolunteerRecord.committeePosition,
          profilePhoto: updatedVolunteerRecord.profilePhoto,
        };
        if (editFormData.password) {
          payload.password = editFormData.password;
        }
        await api.put(`/volunteer/${backendId}`, payload);
      } catch (err) {
        console.warn("Backend volunteer update fallback:", err?.message || err);
      }
    }

    setEditingVolunteer(null);
    setNotification({
      type: "success",
      message: "Volunteer details updated successfully!",
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // ----------------------------------------------------
  // DELETE VOLUNTEER HANDLERS
  // ----------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deletingVolunteer) return;
    setIsDeleting(true);

    const targetKey =
      deletingVolunteer.id ||
      deletingVolunteer._id ||
      deletingVolunteer.enrollmentNumber ||
      deletingVolunteer.enrollmentNo;

    const remaining = volunteers.filter((vol) => {
      const currentKey =
        vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      return currentKey !== targetKey;
    });

    setVolunteers(remaining);

    // Remove from localStorage
    const customVolunteers =
      JSON.parse(localStorage.getItem("axonVolunteers")) || [];
    const remainingCustom = customVolunteers.filter((vol) => {
      const currentKey =
        vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      return currentKey !== targetKey;
    });
    localStorage.setItem("axonVolunteers", JSON.stringify(remainingCustom));
    window.dispatchEvent(new Event("axon-volunteers-change"));

    // Attempt backend soft-delete
    const backendId = deletingVolunteer._id || deletingVolunteer.id;
    if (backendId) {
      try {
        await api.delete(`/volunteer/${backendId}`);
      } catch (err) {
        console.warn("Backend volunteer delete fallback:", err?.message || err);
      }
    }

    setIsDeleting(false);
    setDeletingVolunteer(null);
    setNotification({
      type: "success",
      message: "Volunteer removed successfully.",
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER (Manage Events / Volunteer Style)      */}
      {/* ==================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#24154f] tracking-tight">
              Volunteers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7040d0] border border-purple-200">
              {volunteers.length} Total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            View, filter, edit, and manage all assigned student volunteers
          </p>
        </div>

        {/* Right Controls: Search Box + "+ Add New Volunteer" Popup Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, dept, role..."
              className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add New Volunteer Button (Opens Modal Popup) */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add New Volunteer</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. NOTIFICATIONS                                     */}
      {/* ==================================================== */}
      {notification && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CLEAN HORIZONTAL TABLE VIEW (Manage Events Style) */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Year</th>
                <th className="py-3.5 px-6">Committee Position</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} className="text-gray-300" />
                      <p className="font-semibold text-sm text-gray-700">
                        No volunteers found
                      </p>
                      <p className="text-xs text-gray-400">
                        {search
                          ? `No volunteers match "${search}". Try another keyword.`
                          : "There are currently no registered volunteers."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map((volunteer) => {
                  const key =
                    volunteer.id ||
                    volunteer._id ||
                    volunteer.enrollmentNumber ||
                    volunteer.enrollmentNo;
                  const committeeName =
                    volunteer.committeePosition ||
                    volunteer.committee ||
                    "Volunteer Member";

                  return (
                    <tr
                      key={key}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      {/* 1. Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 text-sm">
                          {volunteer.fullName}
                        </div>
                        {volunteer.enrollmentNumber || volunteer.enrollmentNo ? (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {volunteer.enrollmentNumber || volunteer.enrollmentNo}
                          </div>
                        ) : null}
                      </td>

                      {/* 2. Department (Clean text) */}
                      <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                        {volunteer.department || "IT"}
                      </td>

                      {/* 3. Year (Clean text) */}
                      <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                        {formatYearLabel(volunteer.year || volunteer.academicYear)}
                      </td>

                      {/* 4. Committee Position (Clean text) */}
                      <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                        {committeeName}
                      </td>

                      {/* 5. Actions (Edit & Delete) */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2 text-gray-400">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(volunteer)}
                            title="Edit Volunteer"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-[#7040d0] transition-colors cursor-pointer"
                          >
                            <Pencil size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingVolunteer(volunteer)}
                            title="Delete Volunteer"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
          <span>
            Showing <strong>{filteredVolunteers.length}</strong> of{" "}
            <strong>{volunteers.length}</strong> volunteers
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. ADD NEW VOLUNTEER MODAL POPUP                     */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7040d0] border border-purple-100">
                  <UserPlus size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Add New Volunteer
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Fill in the required information to register a new volunteer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Error Alert */}
            {addError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleSubmitAdd} className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
              {/* 1. Profile Photo (Optional + Remove option) */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Profile Photo{" "}
                  <span className="text-[11px] font-normal text-gray-400 normal-case">
                    (Optional)
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="relative h-16 w-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {addFormData.profilePhoto ? (
                      <img
                        src={addFormData.profilePhoto}
                        alt="Volunteer Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera size={22} className="text-gray-300" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-2xs cursor-pointer">
                        <Upload size={13} className="text-[#7040d0]" />
                        <span>{addFormData.profilePhoto ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleAddImageChange}
                          className="hidden"
                        />
                      </label>

                      {addFormData.profilePhoto && (
                        <button
                          type="button"
                          onClick={handleAddRemovePhoto}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      JPG, PNG, or WebP up to 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={addFormData.fullName}
                    onChange={handleAddChange}
                    placeholder="Enter full name"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Enrollment Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="enrollmentNumber"
                    value={addFormData.enrollmentNumber}
                    onChange={handleAddChange}
                    placeholder="e.g. 230120110001"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 uppercase focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Email ID (No OTP Verification) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email ID (No OTP Verification) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={addFormData.email}
                    onChange={handleAddChange}
                    placeholder="volunteer@vgecg.ac.in"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 lowercase focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    maxLength={10}
                    value={addFormData.phone}
                    onChange={handleAddChange}
                    placeholder="10-digit mobile number"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? "text" : "password"}
                      required
                      name="password"
                      value={addFormData.password}
                      onChange={handleAddChange}
                      placeholder="Minimum 6 characters"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showAddPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAddConfirmPassword ? "text" : "password"}
                      required
                      name="confirmPassword"
                      value={addFormData.confirmPassword}
                      onChange={handleAddChange}
                      placeholder="Re-enter password"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showAddConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="department"
                    value={addFormData.department}
                    onChange={handleAddChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Regular / D2D Dropdown */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Regular / D2D <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="admissionType"
                    value={addFormData.admissionType}
                    onChange={handleAddChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    <option value="regular">Regular</option>
                    <option value="d2d">D2D</option>
                  </select>
                </div>

                {/* Batch */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="batch"
                    value={addFormData.batch}
                    onChange={handleAddChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {addAcademicOptions.batches.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="year"
                    value={addFormData.year}
                    onChange={handleAddChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {addAcademicOptions.years.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Committee Position (Full width) */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Committee Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="committeePosition"
                    value={addFormData.committeePosition}
                    onChange={handleAddChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {COMMITTEE_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdd}
                    className="px-5 py-2 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAdd ? "Adding..." : "Add Volunteer"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. EDIT VOLUNTEER MODAL                              */}
      {/* ==================================================== */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7040d0] border border-purple-100">
                  <Pencil size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Edit Volunteer
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Modify profile details, credentials, and committee role
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingVolunteer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Error Alert */}
            {editError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
              {/* 1. Profile Photo (Optional + Remove option) */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Profile Photo{" "}
                  <span className="text-[11px] font-normal text-gray-400 normal-case">
                    (Optional)
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="relative h-16 w-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {editFormData.profilePhoto ? (
                      <img
                        src={editFormData.profilePhoto}
                        alt="Volunteer Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera size={22} className="text-gray-300" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-2xs cursor-pointer">
                        <Upload size={13} className="text-[#7040d0]" />
                        <span>{editFormData.profilePhoto ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleEditImageChange}
                          className="hidden"
                        />
                      </label>

                      {editFormData.profilePhoto && (
                        <button
                          type="button"
                          onClick={handleEditRemovePhoto}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      JPG, PNG, or WebP up to 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Enrollment Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="enrollmentNumber"
                    value={editFormData.enrollmentNumber}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 uppercase focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Email ID (No OTP Verification) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email ID (No OTP Verification) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 lowercase focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    maxLength={10}
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                  />
                </div>

                {/* Password (Optional for updates) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    New Password{" "}
                    <span className="text-[10px] text-gray-400 font-normal">
                      (Leave blank to keep unchanged)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditChange}
                      placeholder="Enter new password"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showEditConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={editFormData.confirmPassword}
                      onChange={handleEditChange}
                      placeholder="Re-enter new password"
                      className="w-full h-9 pl-3 pr-9 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowEditConfirmPassword(!showEditConfirmPassword)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showEditConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Regular / D2D Dropdown */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Regular / D2D <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="admissionType"
                    value={editFormData.admissionType}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    <option value="regular">Regular</option>
                    <option value="d2d">D2D</option>
                  </select>
                </div>

                {/* Batch */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="batch"
                    value={editFormData.batch}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {editAcademicOptions.batches.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {editAcademicOptions.years.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Committee Position (Full width) */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Committee Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="committeePosition"
                    value={editFormData.committeePosition}
                    onChange={handleEditChange}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition cursor-pointer"
                  >
                    {COMMITTEE_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingVolunteer(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL                         */}
      {/* ==================================================== */}
      {deletingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delete Volunteer?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove{" "}
                <strong className="text-gray-800">
                  {deletingVolunteer.fullName}
                </strong>
                ? This action will revoke their volunteer privileges.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingVolunteer(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs flex-1 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Volunteers;