import User from "../models/User.js";
import CommitteePosition from "../models/CommitteePosition.js";
import Branch from "../models/Branch.js";

/**
 * Volunteer Controller
 * Handles Admin-provisioned volunteer creation, committee assignment, listing, updates, and soft-delete.
 */

// =========================================================================
// 1. CREATE VOLUNTEER (Admin Only)
// =========================================================================
export const createVolunteer = async (req, res) => {
  try {
    const {
      fullName,
      enrollmentNumber,
      enrollmentNo,
      email,
      password,
      phoneNumber,
      phone,
      department,
      committeePosition,
      positionName,
      batch,
      admissionType,
      profilePhoto,
    } = req.body;

    const trimmedName = (fullName || "").trim();
    const trimmedEnroll = (enrollmentNumber || enrollmentNo || "").trim().toUpperCase();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phoneNumber || phone || "").trim();
    const deptCode = (department || "IT").trim().toUpperCase();
    const photo = (profilePhoto || "").trim() || "/assets/images/profile/default.jpg";

    // Validations
    if (!trimmedName || trimmedName.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Volunteer full name is required (minimum 3 characters).",
      });
    }

    if (!trimmedEnroll) {
      return res.status(400).json({
        success: false,
        message: "Enrollment number is required for volunteers.",
      });
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid college email address is required.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "A valid 10-digit Indian phone number is required.",
      });
    }

    // Check for duplicate active user
    const existingUser = await User.findOne({
      $or: [{ email: trimmedEmail }, { enrollmentNumber: trimmedEnroll }],
      isDeleted: false,
    });

    if (existingUser) {
      const field = existingUser.email === trimmedEmail ? "Email" : "Enrollment Number";
      return res.status(409).json({
        success: false,
        message: `A user with this ${field} already exists.`,
      });
    }

    // Resolve or find Committee Position
    let resolvedPosition = null;
    if (committeePosition && /^[0-9a-fA-F]{24}$/.test(committeePosition)) {
      resolvedPosition = committeePosition;
    } else {
      const posName = (positionName || committeePosition || "Volunteer Coordinator").trim();
      let posDoc = await CommitteePosition.findOne({
        name: new RegExp(`^${posName}$`, "i"),
        isDeleted: false,
      });

      if (!posDoc) {
        posDoc = await CommitteePosition.create({
          name: posName,
          description: `AXON Committee Position: ${posName}`,
        });
      }
      resolvedPosition = posDoc._id;
    }

    // Resolve Batch
    let batchObj = { startYear: 2024, endYear: 2028 };
    if (typeof batch === "string" && batch.includes("-")) {
      const parts = batch.split("-");
      let startY = parseInt(parts[0].trim());
      let endY = parseInt(parts[1].trim());
      if (endY < 100) endY += 2000;
      if (!isNaN(startY) && !isNaN(endY)) {
        batchObj = { startYear: startY, endYear: endY };
      }
    } else if (typeof batch === "object" && batch.startYear && batch.endYear) {
      batchObj = { startYear: Number(batch.startYear), endYear: Number(batch.endYear) };
    }

    // Resolve Branch
    const foundBranch = await Branch.findOne({ code: deptCode });
    const resolvedBranch = foundBranch ? foundBranch._id : null;

    // Create Volunteer User
    const newVolunteer = await User.create({
      role: "volunteer",
      fullName: trimmedName,
      enrollmentNumber: trimmedEnroll,
      email: trimmedEmail,
      password,
      department: deptCode,
      branch: resolvedBranch,
      batch: batchObj,
      admissionType: (admissionType || "regular").toLowerCase(),
      phoneNumber: cleanPhone,
      profilePhoto: photo,
      committeePosition: resolvedPosition,
      createdBy: req.user._id,
      emailVerified: true,
      accountStatus: "active",
    });

    await newVolunteer.populate("committeePosition", "name description");

    return res.status(201).json({
      success: true,
      message: `Volunteer ${newVolunteer.fullName} created successfully.`,
      volunteer: newVolunteer,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] createVolunteer Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create volunteer account.",
    });
  }
};

// =========================================================================
// 2. GET ALL VOLUNTEERS
// =========================================================================
export const getVolunteers = async (req, res) => {
  try {
    const { department, search, position } = req.query;

    const query = {
      role: "volunteer",
      isDeleted: false,
    };

    if (department) {
      query.department = department.toUpperCase();
    }

    if (position && /^[0-9a-fA-F]{24}$/.test(position)) {
      query.committeePosition = position;
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { fullName: new RegExp(keyword, "i") },
        { email: new RegExp(keyword, "i") },
        { enrollmentNumber: new RegExp(keyword, "i") },
      ];
    }

    const volunteers = await User.find(query)
      .select("-password")
      .populate("committeePosition", "name description")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] getVolunteers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteers.",
    });
  }
};

// =========================================================================
// 3. GET VOLUNTEER BY ID
// =========================================================================
export const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
      isDeleted: false,
    })
      .select("-password")
      .populate("committeePosition", "name description")
      .populate("createdBy", "fullName email")
      .populate("branch", "name code");

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      volunteer,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] getVolunteerById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve volunteer profile.",
    });
  }
};

// =========================================================================
// 4. UPDATE VOLUNTEER (Admin Only)
// =========================================================================
export const updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      phone,
      department,
      committeePosition,
      accountStatus,
      profilePhoto,
    } = req.body;

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
      isDeleted: false,
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found.",
      });
    }

    if (fullName) volunteer.fullName = fullName.trim();
    if (department) volunteer.department = department.trim().toUpperCase();
    if (profilePhoto) volunteer.profilePhoto = profilePhoto.trim();
    if (accountStatus && ["active", "inactive", "suspended"].includes(accountStatus)) {
      volunteer.accountStatus = accountStatus;
    }

    const newPhone = phoneNumber || phone;
    if (newPhone) {
      const cleanPhone = newPhone.trim();
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit Indian phone number.",
        });
      }
      volunteer.phoneNumber = cleanPhone;
    }

    if (committeePosition && /^[0-9a-fA-F]{24}$/.test(committeePosition)) {
      volunteer.committeePosition = committeePosition;
    }

    await volunteer.save();
    await volunteer.populate("committeePosition", "name description");

    return res.status(200).json({
      success: true,
      message: "Volunteer updated successfully.",
      volunteer,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] updateVolunteer Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update volunteer.",
    });
  }
};

// =========================================================================
// 5. DELETE VOLUNTEER (Soft-Delete - Admin Only)
// =========================================================================
export const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
      isDeleted: false,
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found or already deleted.",
      });
    }

    volunteer.isDeleted = true;
    volunteer.deletedAt = new Date();
    volunteer.deletedBy = req.user._id;
    volunteer.accountStatus = "inactive";
    await volunteer.save();

    return res.status(200).json({
      success: true,
      message: `Volunteer ${volunteer.fullName} has been removed.`,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] deleteVolunteer Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete volunteer.",
    });
  }
};

// =========================================================================
// 6. COMMITTEE POSITIONS HELPERS
// =========================================================================
export const getCommitteePositions = async (req, res) => {
  try {
    const positions = await CommitteePosition.find({ isDeleted: false, isActive: true }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: positions.length,
      positions,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] getCommitteePositions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch committee positions.",
    });
  }
};

export const createCommitteePosition = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Committee position name is required.",
      });
    }

    const pos = await CommitteePosition.create({
      name: name.trim(),
      description: (description || "").trim(),
    });

    return res.status(201).json({
      success: true,
      position: pos,
    });
  } catch (error) {
    console.error("❌ [Volunteer Controller] createCommitteePosition Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create committee position.",
    });
  }
};

export default {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
  getCommitteePositions,
  createCommitteePosition,
};
