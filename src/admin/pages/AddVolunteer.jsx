import { useState } from "react";
import {
  ImagePlus,
  Upload,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { users } from "../../mockData";

function AddVolunteer() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [committee, setCommittee] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [message, setMessage] = useState("");

  // Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfilePhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // Add volunteer
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !fullName ||
      !enrollmentNo ||
      !email ||
      !phone ||
      !department ||
      !year ||
      !semester ||
      !committee
    ) {
      alert("Please fill all fields.");
      return;
    }

    const volunteers = users.filter(
      (user) => user.role === "volunteer"
    );

    const newVolunteerNumber =
      volunteers.length + 1;

    const newVolunteer = {
      id: `VL${String(newVolunteerNumber).padStart(
        3,
        "0"
      )}`,
      role: "volunteer",
      fullName,
      enrollmentNo,
      email,
      phone,
      department,
      year: Number(year),
      semester: Number(semester),
      profilePhoto:
        profilePhoto ||
        "/assets/images/profile/default.jpg",
      committee,
      isActive: true,
    };

    // Store temporarily in localStorage
    const existingVolunteers =
      JSON.parse(
        localStorage.getItem("axonVolunteers")
      ) || [];

    localStorage.setItem(
      "axonVolunteers",
      JSON.stringify([
        ...existingVolunteers,
        newVolunteer,
      ])
    );

    setMessage(
      "Volunteer added successfully!"
    );

    // Redirect after success message
    setTimeout(() => {
      navigate("/admin/volunteers");
    }, 1200);
  };

  return (
    <main className="dashboard add-volunteer-page">

      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>
          <h2>Add Volunteer</h2>

          <p>
            Add a new volunteer to the system
          </p>
        </div>

      </div>


      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="volunteer-success-message">
          <span>✓</span>
          {message}
        </div>
      )}


      {/* FORM CARD */}

      <section className="add-volunteer-card">

        <div className="add-volunteer-card-header">

          <div className="add-volunteer-header-icon">
            <UserPlus size={20} />
          </div>

          <div>
            <h3>
              Volunteer Information
            </h3>

            <p>
              Enter the volunteer's details
            </p>
          </div>

        </div>


        <form onSubmit={handleSubmit}>

          {/* PROFILE IMAGE */}

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

              <h4>
                Profile Image
              </h4>

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


          {/* FORM GRID */}

          <div className="volunteer-form-grid">

            {/* FULL NAME */}

            <div className="volunteer-form-group">

              <label>
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />

            </div>


            {/* ENROLLMENT ID */}

            <div className="volunteer-form-group">

              <label>
                Enrollment ID
              </label>

              <input
                type="text"
                placeholder="Enter enrollment ID"
                value={enrollmentNo}
                onChange={(e) =>
                  setEnrollmentNo(e.target.value)
                }
              />

            </div>


            {/* EMAIL */}

            <div className="volunteer-form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>


            {/* PHONE */}

            <div className="volunteer-form-group">

              <label>
                Phone Number
              </label>

              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />

            </div>


            {/* BRANCH */}

            <div className="volunteer-form-group">

              <label>
                Branch
              </label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
              >

                <option value="">
                  Select Branch
                </option>

                <option value="IT">
                  IT
                </option>

                <option value="CE">
                  CE
                </option>

                <option value="ICT">
                  ICT
                </option>

                <option value="EC">
                  EC
                </option>

              </select>

            </div>


            {/* YEAR */}

            <div className="volunteer-form-group">

              <label>
                Year
              </label>

              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
              >

                <option value="">
                  Select Year
                </option>

                <option value="1">
                  1st Year
                </option>

                <option value="2">
                  2nd Year
                </option>

                <option value="3">
                  3rd Year
                </option>

                <option value="4">
                  4th Year
                </option>

              </select>

            </div>


            {/* SEMESTER */}

            <div className="volunteer-form-group">

              <label>
                Semester
              </label>

              <select
                value={semester}
                onChange={(e) =>
                  setSemester(e.target.value)
                }
              >

                <option value="">
                  Select Semester
                </option>

                <option value="1">
                  Semester 1
                </option>

                <option value="2">
                  Semester 2
                </option>

                <option value="3">
                  Semester 3
                </option>

                <option value="4">
                  Semester 4
                </option>

                <option value="5">
                  Semester 5
                </option>

                <option value="6">
                  Semester 6
                </option>

                <option value="7">
                  Semester 7
                </option>

                <option value="8">
                  Semester 8
                </option>

              </select>

            </div>


            {/* COMMITTEE */}

            <div className="volunteer-form-group">

              <label>
                Committee / Work Area
              </label>

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

                <option value="Design">
                  Design
                </option>

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

          </div>


          {/* BUTTONS */}

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
              <UserPlus size={16} />
              Add Volunteer
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}

export default AddVolunteer;