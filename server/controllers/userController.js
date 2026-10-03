import User from "../models/User.js";
import CommitteePosition from "../models/CommitteePosition.js";

/**
 * Get User Profile
 * GET /api/users/profile
 * Access: Protected | Allowed Roles: student, volunteer, admin
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("committeePosition")
      .populate("workingUnder", "fullName email");

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          id: user._id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          enrollmentNumber: user.enrollmentNumber,
          enrollmentNo: user.enrollmentNumber,
          role: user.role,
          department: user.department,
          admissionType: user.admissionType,
          currentYear: user.currentYear,
          year: user.year,
          semester: user.semester,
          batch: user.batch,
          batchDisplay: user.batchDisplay,
          phoneNumber: user.phoneNumber,
          phone: user.phoneNumber,
          profilePhoto: user.profilePhoto,
          accountStatus: user.accountStatus,
          committeePosition: user.committeePosition,
          designation: user.committeePosition?.name || "",
          workingUnder: user.workingUnder,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile.",
    });
  }
};

/**
 * Update User Profile
 * PUT /api/users/profile
 * Access: Protected | Allowed Roles: student, volunteer, admin
 */
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

    if (fullName && fullName.trim().length >= 3) {
      user.fullName = fullName.trim();
    }

    if (phoneNumber || phone) {
      const p = (phoneNumber || phone || "").trim();
      if (/^[0-9]{10}$/.test(p)) {
        user.phoneNumber = p;
      } else {
        return res.status(400).json({
          success: false,
          message: "Phone number must be a valid 10-digit number.",
        });
      }
    }

    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto;
    }

    if (department) {
      user.department = department.trim().toUpperCase();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: {
          _id: user._id,
          id: user._id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          enrollmentNumber: user.enrollmentNumber,
          enrollmentNo: user.enrollmentNumber,
          role: user.role,
          department: user.department,
          admissionType: user.admissionType,
          currentYear: user.currentYear,
          year: user.year,
          semester: user.semester,
          batchDisplay: user.batchDisplay,
          phoneNumber: user.phoneNumber,
          phone: user.phoneNumber,
          profilePhoto: user.profilePhoto,
          accountStatus: user.accountStatus,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

/**
 * Change Password
 * PUT /api/users/change-password
 * Access: Protected | Allowed Roles: student, volunteer, admin
 */
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
        message: "New password and confirm password do not match.",
      });
    }

    // Load user with password field
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change password.",
    });
  }
};

/**
 * Get Volunteers List
 * GET /api/users/volunteers
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: "volunteer",
      isDeleted: false,
    })
      .populate("committeePosition")
      .populate("workingUnder", "fullName email")
      .sort({ createdAt: -1 });

    const formatted = volunteers.map((v) => ({
      _id: v._id,
      id: v._id,
      fullName: v.fullName,
      name: v.fullName,
      email: v.email,
      enrollmentNumber: v.enrollmentNumber,
      enrollmentNo: v.enrollmentNumber,
      department: v.department,
      phone: v.phoneNumber,
      phoneNumber: v.phoneNumber,
      role: v.role,
      designation: v.committeePosition?.name || "Volunteer",
      committee: v.committeePosition?.name || "General",
      workingUnder: v.workingUnder?.fullName || "TCF Executive",
      profilePhoto: v.profilePhoto || "",
      isActive: v.accountStatus === "active",
      createdAt: v.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteers.",
    });
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  getVolunteers,
};

