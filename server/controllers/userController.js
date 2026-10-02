import User from "../models/User.js";

/**
 * User Controller
 * Handles user profile retrieval, profile updates, password change, and admin user querying.
 */

// =========================================================================
// 1. GET PROFILE (Current Logged-in User)
// =========================================================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("branch", "name code")
      .populate("committeePosition", "name description");

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        role: user.role,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        enrollmentNumber: user.enrollmentNumber || "",
        enrollmentNo: user.enrollmentNumber || "",
        department: user.department || "",
        branch: user.branch || null,
        admissionType: user.admissionType || "regular",
        courseType: user.admissionType === "d2d" ? "D2D" : "Regular",
        batch: user.batchDisplay || (user.batch?.startYear ? `${user.batch.startYear}-${user.batch.endYear}` : ""),
        batchDetails: user.batch || null,
        currentYear: user.currentYear || null,
        year: user.year || "",
        semester: user.semester || null,
        phoneNumber: user.phoneNumber || "",
        phone: user.phoneNumber || "",
        profilePhoto: user.profilePhoto || "",
        committeePosition: user.committeePosition || null,
        accountStatus: user.accountStatus || "active",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ [User Controller] getProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve user profile.",
    });
  }
};

// =========================================================================
// 2. UPDATE PROFILE
// =========================================================================
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { fullName, phoneNumber, phone, profilePhoto, department } = req.body;

    // Validate and update Full Name
    if (fullName !== undefined) {
      if (fullName.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Full name must be at least 3 characters.",
        });
      }
      user.fullName = fullName.trim();
    }

    // Validate and update Phone Number
    const newPhone = phoneNumber || phone;
    if (newPhone !== undefined) {
      const cleanPhone = newPhone.trim();
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit Indian phone number.",
        });
      }
      user.phoneNumber = cleanPhone;
    }

    // Update Profile Photo
    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto.trim();
    }

    // Update Department (if student or admin)
    if (department !== undefined && department.trim()) {
      user.department = department.trim().toUpperCase();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ [User Controller] updateProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

// =========================================================================
// 3. CHANGE PASSWORD
// =========================================================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and Confirm Password do not match.",
      });
    }

    // Fetch user with password field
    const user = await User.findById(req.user._id).select("+password");

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect current password. Please try again.",
      });
    }

    // Set new password (will be hashed automatically by pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please use your new password next time.",
    });
  } catch (error) {
    console.error("❌ [User Controller] changePassword Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change password.",
    });
  }
};

// =========================================================================
// 4. GET ALL USERS (Admin / Volunteer with Filters & Pagination)
// =========================================================================
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      department,
      admissionType,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isDeleted: false };

    // Role filter
    if (role && ["student", "volunteer", "admin"].includes(role)) {
      query.role = role;
    }

    // Department filter
    if (department) {
      query.department = department.toUpperCase();
    }

    // Admission type filter
    if (admissionType && ["regular", "d2d"].includes(admissionType.toLowerCase())) {
      query.admissionType = admissionType.toLowerCase();
    }

    // Search keyword by name, email, or enrollmentNumber
    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { fullName: new RegExp(keyword, "i") },
        { email: new RegExp(keyword, "i") },
        { enrollmentNumber: new RegExp(keyword, "i") },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .populate("committeePosition", "name")
      .populate("branch", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNum),
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    console.error("❌ [User Controller] getAllUsers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users.",
    });
  }
};

// =========================================================================
// 5. GET USER BY ID
// =========================================================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if queried by ObjectId or enrollment number
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId
      ? { _id: id, isDeleted: false }
      : { enrollmentNumber: id.toUpperCase(), isDeleted: false };

    const user = await User.findOne(query)
      .select("-password")
      .populate("committeePosition", "name description")
      .populate("branch", "name code");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ [User Controller] getUserById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user details.",
    });
  }
};

// =========================================================================
// 6. DELETE USER (Soft-Delete - Admin Only)
// =========================================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent Admin from deleting self
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own administrative account.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted.",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.accountStatus = "inactive";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} (${user.role}) has been removed successfully.`,
    });
  } catch (error) {
    console.error("❌ [User Controller] deleteUser Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user.",
    });
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
};
