// import { useState } from "react";
// import {
//   ImagePlus,
//   Upload,
//   UserPlus,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { users } from "../../mockData";

// function AddVolunteer() {
//   const navigate = useNavigate();

//   const [fullName, setFullName] = useState("");
//   const [enrollmentNo, setEnrollmentNo] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [department, setDepartment] = useState("");
//   const [year, setYear] = useState("");
//   const [semester, setSemester] = useState("");
//   const [committee, setCommittee] = useState("");
//   const [profilePhoto, setProfilePhoto] = useState("");

//   const [message, setMessage] = useState("");

//   // Image upload
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];

//     if (!file) return;

//     const reader = new FileReader();

//     reader.onloadend = () => {
//       setProfilePhoto(reader.result);
//     };

//     reader.readAsDataURL(file);
//   };

//   // Add volunteer
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (
//       !fullName ||
//       !enrollmentNo ||
//       !email ||
//       !phone ||
//       !department ||
//       !year ||
//       !semester ||
//       !committee
//     ) {
//       alert("Please fill all fields.");
//       return;
//     }

//     const volunteers = users.filter(
//       (user) => user.role === "volunteer"
//     );

//     const newVolunteerNumber =
//       volunteers.length + 1;

//     const newVolunteer = {
//       id: `VL${String(newVolunteerNumber).padStart(
//         3,
//         "0"
//       )}`,
//       role: "volunteer",
//       fullName,
//       enrollmentNo,
//       email,
//       phone,
//       department,
//       year: Number(year),
//       semester: Number(semester),
//       profilePhoto:
//         profilePhoto ||
//         "/assets/images/profile/default.jpg",
//       committee,
//       isActive: true,
//     };

//     // Store temporarily in localStorage
//     const existingVolunteers =
//       JSON.parse(
//         localStorage.getItem("axonVolunteers")
//       ) || [];

//     localStorage.setItem(
//       "axonVolunteers",
//       JSON.stringify([
//         ...existingVolunteers,
//         newVolunteer,
//       ])
//     );

//     setMessage(
//       "Volunteer added successfully!"
//     );

//     // Redirect after success message
//     setTimeout(() => {
//       navigate("/admin/volunteers");
//     }, 1200);
//   };

//   return (
//     <main className="dashboard add-volunteer-page">

//       {/* PAGE HEADER */}

//       <div className="page-heading">

//         <div>
//           <h2>Add Volunteer</h2>

//           <p>
//             Add a new volunteer to the system
//           </p>
//         </div>

//       </div>


//       {/* SUCCESS MESSAGE */}

//       {message && (
//         <div className="volunteer-success-message">
//           <span>✓</span>
//           {message}
//         </div>
//       )}


//       {/* FORM CARD */}

//       <section className="add-volunteer-card">

//         <div className="add-volunteer-card-header">

//           <div className="add-volunteer-header-icon">
//             <UserPlus size={20} />
//           </div>

//           <div>
//             <h3>
//               Volunteer Information
//             </h3>

//             <p>
//               Enter the volunteer's details
//             </p>
//           </div>

//         </div>


//         <form onSubmit={handleSubmit}>

//           {/* PROFILE IMAGE */}

//           <div className="volunteer-image-upload">

//             <div className="volunteer-image-preview">

//               {profilePhoto ? (
//                 <img
//                   src={profilePhoto}
//                   alt="Volunteer preview"
//                 />
//               ) : (
//                 <ImagePlus size={30} />
//               )}

//             </div>

//             <div className="image-upload-content">

//               <h4>
//                 Profile Image
//               </h4>

//               <p>
//                 Upload a photo of the volunteer
//               </p>

//               <label className="image-upload-button">

//                 <Upload size={15} />

//                 Choose Image

//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   hidden
//                 />

//               </label>

//             </div>

//           </div>


//           {/* FORM GRID */}

//           <div className="volunteer-form-grid">

//             {/* FULL NAME */}

//             <div className="volunteer-form-group">

//               <label>
//                 Full Name
//               </label>

//               <input
//                 type="text"
//                 placeholder="Enter full name"
//                 value={fullName}
//                 onChange={(e) =>
//                   setFullName(e.target.value)
//                 }
//               />

//             </div>


//             {/* ENROLLMENT ID */}

//             <div className="volunteer-form-group">

//               <label>
//                 Enrollment ID
//               </label>

//               <input
//                 type="text"
//                 placeholder="Enter enrollment ID"
//                 value={enrollmentNo}
//                 onChange={(e) =>
//                   setEnrollmentNo(e.target.value)
//                 }
//               />

//             </div>


//             {/* EMAIL */}

//             <div className="volunteer-form-group">

//               <label>
//                 Email
//               </label>

//               <input
//                 type="email"
//                 placeholder="Enter email address"
//                 value={email}
//                 onChange={(e) =>
//                   setEmail(e.target.value)
//                 }
//               />

//             </div>


//             {/* PHONE */}

//             <div className="volunteer-form-group">

//               <label>
//                 Phone Number
//               </label>

//               <input
//                 type="tel"
//                 placeholder="Enter phone number"
//                 value={phone}
//                 onChange={(e) =>
//                   setPhone(e.target.value)
//                 }
//               />

//             </div>


//             {/* BRANCH */}

//             <div className="volunteer-form-group">

//               <label>
//                 Branch
//               </label>

//               <select
//                 value={department}
//                 onChange={(e) =>
//                   setDepartment(e.target.value)
//                 }
//               >

//                 <option value="">
//                   Select Branch
//                 </option>

//                 <option value="IT">
//                   IT
//                 </option>

//                 <option value="CE">
//                   CE
//                 </option>

//                 <option value="ICT">
//                   ICT
//                 </option>

//                 <option value="EC">
//                   EC
//                 </option>

//               </select>

//             </div>


//             {/* YEAR */}

//             <div className="volunteer-form-group">

//               <label>
//                 Year
//               </label>

//               <select
//                 value={year}
//                 onChange={(e) =>
//                   setYear(e.target.value)
//                 }
//               >

//                 <option value="">
//                   Select Year
//                 </option>

//                 <option value="1">
//                   1st Year
//                 </option>

//                 <option value="2">
//                   2nd Year
//                 </option>

//                 <option value="3">
//                   3rd Year
//                 </option>

//                 <option value="4">
//                   4th Year
//                 </option>

//               </select>

//             </div>


//             {/* SEMESTER */}

//             <div className="volunteer-form-group">

//               <label>
//                 Semester
//               </label>

//               <select
//                 value={semester}
//                 onChange={(e) =>
//                   setSemester(e.target.value)
//                 }
//               >

//                 <option value="">
//                   Select Semester
//                 </option>

//                 <option value="1">
//                   Semester 1
//                 </option>

//                 <option value="2">
//                   Semester 2
//                 </option>

//                 <option value="3">
//                   Semester 3
//                 </option>

//                 <option value="4">
//                   Semester 4
//                 </option>

//                 <option value="5">
//                   Semester 5
//                 </option>

//                 <option value="6">
//                   Semester 6
//                 </option>

//                 <option value="7">
//                   Semester 7
//                 </option>

//                 <option value="8">
//                   Semester 8
//                 </option>

//               </select>

//             </div>


//             {/* COMMITTEE */}

//             <div className="volunteer-form-group">

//               <label>
//                 Committee / Work Area
//               </label>

//               <select
//                 value={committee}
//                 onChange={(e) =>
//                   setCommittee(e.target.value)
//                 }
//               >

//                 <option value="">
//                   Select Committee
//                 </option>

//                 <option value="Photography">
//                   Photography
//                 </option>

//                 <option value="Technical">
//                   Technical
//                 </option>

//                 <option value="Event Management">
//                   Event Management
//                 </option>

//                 <option value="Publicity & Promotion">
//                   Publicity & Promotion
//                 </option>

//                 <option value="Registration">
//                   Registration
//                 </option>

//                 <option value="Design">
//                   Design
//                 </option>

//                 <option value="Social Media">
//                   Social Media
//                 </option>

//                 <option value="Content & Documentation">
//                   Content & Documentation
//                 </option>

//                 <option value="Hospitality">
//                   Hospitality
//                 </option>

//                 <option value="Logistics">
//                   Logistics
//                 </option>

//               </select>

//             </div>

//           </div>


//           {/* BUTTONS */}

//           <div className="add-volunteer-actions">

//             <button
//               type="button"
//               className="secondary-task-button"
//               onClick={() =>
//                 navigate("/admin/volunteers")
//               }
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="primary-button"
//             >
//               <UserPlus size={16} />
//               Add Volunteer
//             </button>

//           </div>

//         </form>

//       </section>

//     </main>
//   );
// }

// export default AddVolunteer;


import { useEffect, useState } from "react";
import {
  ImagePlus,
  Upload,
  UserPlus,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { users } from "../../mockData";

const STORAGE_KEY = "axonVolunteers";

function AddVolunteer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [committee, setCommittee] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const storedVolunteers =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const volunteer = storedVolunteers.find(
      (item) => item.id === editId
    );

    if (!volunteer) {
      alert("Volunteer not found.");
      navigate("/admin/volunteers");
      return;
    }

    setFullName(volunteer.fullName || "");
    setEnrollmentNo(volunteer.enrollmentNo || "");
    setEmail(volunteer.email || "");
    setPhone(volunteer.phone || "");
    setDepartment(volunteer.department || "");
    setYear(
      volunteer.year !== undefined
        ? String(volunteer.year)
        : ""
    );
    setSemester(
      volunteer.semester !== undefined
        ? String(volunteer.semester)
        : ""
    );
    setCommittee(volunteer.committee || "");
    setProfilePhoto(volunteer.profilePhoto || "");
    setPassword(volunteer.password || "");
  }, [editId, isEditMode, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfilePhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !enrollmentNo.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !department ||
      !year ||
      !semester ||
      !committee
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!isEditMode && !password.trim()) {
      alert("Please set a password for the volunteer.");
      return;
    }

    const storedVolunteers =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (isEditMode) {
      const updatedVolunteers =
        storedVolunteers.map((volunteer) => {
          if (volunteer.id !== editId) {
            return volunteer;
          }

          return {
            ...volunteer,
            fullName: fullName.trim(),
            enrollmentNo: enrollmentNo.trim(),
            email: email.trim(),
            phone: phone.trim(),
            department,
            year: Number(year),
            semester: Number(semester),
            committee,
            profilePhoto:
              profilePhoto ||
              "/assets/images/profile/default.jpg",
            ...(password.trim()
              ? { password: password.trim() }
              : {}),
          };
        });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedVolunteers)
      );

      setMessage("Volunteer updated successfully!");
    } else {
      const allVolunteerIds = [
        ...users.filter(
          (user) => user.role === "volunteer"
        ),
        ...storedVolunteers,
      ].map((volunteer) => volunteer.id);

      let newVolunteerNumber = 1;

      while (
        allVolunteerIds.includes(
          `VL${String(newVolunteerNumber).padStart(
            3,
            "0"
          )}`
        )
      ) {
        newVolunteerNumber += 1;
      }

      const newVolunteer = {
        id: `VL${String(newVolunteerNumber).padStart(
          3,
          "0"
        )}`,
        role: "volunteer",
        fullName: fullName.trim(),
        enrollmentNo: enrollmentNo.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department,
        year: Number(year),
        semester: Number(semester),
        profilePhoto:
          profilePhoto ||
          "/assets/images/profile/default.jpg",
        committee,
        password: password.trim(),
        isActive: true,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          ...storedVolunteers,
          newVolunteer,
        ])
      );

      setMessage("Volunteer added successfully!");
    }

    setTimeout(() => {
      navigate("/admin/volunteers");
    }, 1000);
  };

  return (
    <main className="dashboard add-volunteer-page">
      <div className="page-heading">
        <div>
          <h2>
            {isEditMode
              ? "Edit Volunteer"
              : "Add Volunteer"}
          </h2>

          <p>
            {isEditMode
              ? "Update the volunteer's information"
              : "Add a new volunteer to the system"}
          </p>
        </div>
      </div>

      {message && (
        <div className="volunteer-success-message">
          <span>✓</span>
          {message}
        </div>
      )}

      <section className="add-volunteer-card">
        <div className="add-volunteer-card-header">
          <div className="add-volunteer-header-icon">
            {isEditMode ? (
              <Save size={20} />
            ) : (
              <UserPlus size={20} />
            )}
          </div>

          <div>
            <h3>Volunteer Information</h3>

            <p>
              {isEditMode
                ? "Update the volunteer's details"
                : "Enter the volunteer's details"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="volunteer-image-upload">
            <div className="volunteer-image-preview">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Volunteer preview"
                />
              ) : (
                <ImagePlus size={30} />
              )}
            </div>

            <div className="image-upload-content">
              <h4>Profile Image</h4>

              <p>
                Upload a photo of the volunteer
              </p>

              <label className="image-upload-button">
                <Upload size={15} />
                Choose Image

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
            </div>
          </div>

          <div className="volunteer-form-grid">
            <div className="volunteer-form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />
            </div>

            <div className="volunteer-form-group">
              <label>Enrollment ID</label>

              <input
                type="text"
                placeholder="Enter enrollment ID"
                value={enrollmentNo}
                onChange={(e) =>
                  setEnrollmentNo(e.target.value)
                }
              />
            </div>

            <div className="volunteer-form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="volunteer-form-group">
              <label>Phone Number</label>

              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />
            </div>

            <div className="volunteer-form-group">
              <label>Branch</label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
              >
                <option value="">
                  Select Branch
                </option>
                <option value="IT">IT</option>
                <option value="CE">CE</option>
                <option value="ICT">ICT</option>
                <option value="EC">EC</option>
              </select>
            </div>

            <div className="volunteer-form-group">
              <label>Year</label>

              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="volunteer-form-group">
              <label>Semester</label>

              <select
                value={semester}
                onChange={(e) =>
                  setSemester(e.target.value)
                }
              >
                <option value="">
                  Select Semester
                </option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div className="volunteer-form-group">
              <label>Committee / Work Area</label>

              <select
                value={committee}
                onChange={(e) =>
                  setCommittee(e.target.value)
                }
              >
                <option value="">
                  Select Committee
                </option>
                <option value="Photography">
                  Photography
                </option>
                <option value="Technical">
                  Technical
                </option>
                <option value="Event Management">
                  Event Management
                </option>
                <option value="Publicity & Promotion">
                  Publicity & Promotion
                </option>
                <option value="Registration">
                  Registration
                </option>
                <option value="Design">Design</option>
                <option value="Social Media">
                  Social Media
                </option>
                <option value="Content & Documentation">
                  Content & Documentation
                </option>
                <option value="Hospitality">
                  Hospitality
                </option>
                <option value="Logistics">
                  Logistics
                </option>
              </select>
            </div>

            <div className="volunteer-form-group volunteer-password-group">
              <label>
                Password{" "}
                {isEditMode && (
                  <span>(leave blank to keep current)</span>
                )}
              </label>

              <div className="password-input-wrapper">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder={
                    isEditMode
                      ? "Enter new password"
                      : "Set volunteer password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="add-volunteer-actions">
            <button
              type="button"
              className="secondary-task-button"
              onClick={() =>
                navigate("/admin/volunteers")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              {isEditMode ? (
                <Save size={16} />
              ) : (
                <UserPlus size={16} />
              )}

              {isEditMode
                ? "Update Volunteer"
                : "Add Volunteer"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default AddVolunteer;
