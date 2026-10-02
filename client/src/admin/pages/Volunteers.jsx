// import { useEffect, useState } from "react";
// import { Users } from "lucide-react";

// import { users } from "../../mockData";

// function Volunteers() {
//   const [volunteers, setVolunteers] = useState([]);

//   useEffect(() => {
//     const mockVolunteers = users.filter(
//       (user) => user.role === "volunteer"
//     );

//     const addedVolunteers =
//       JSON.parse(
//         localStorage.getItem("axonVolunteers")
//       ) || [];

//     setVolunteers([
//       ...mockVolunteers,
//       ...addedVolunteers,
//     ]);
//   }, []);

//   return (
//     <main className="dashboard">

//       <div className="page-heading">

//         <div>
//           <h2>Volunteer Management</h2>

//           <p>
//             View and manage all volunteers
//           </p>
//         </div>

//       </div>


//       <div className="volunteer-count">

//         <Users size={18} />

//         <span>
//           <strong>
//             {volunteers.length}
//           </strong>{" "}
//           Volunteers
//         </span>

//       </div>


//       <section className="volunteer-grid">

//         {volunteers.map((volunteer) => (

//           <div
//             className="volunteer-card"
//             key={volunteer.id}
//           >

//             <div className="volunteer-image">

//               <img
//                 src={
//                   volunteer.profilePhoto ||
//                   "/assets/images/profile/default.jpg"
//                 }
//                 alt={volunteer.fullName}
//               />

//             </div>


//             <div className="volunteer-details">

//               <h3>
//                 {volunteer.fullName}
//               </h3>

//               <p>
//                 <strong>ID:</strong>{" "}
//                 {volunteer.id}
//               </p>

//               <p>
//                 <strong>Email:</strong>{" "}
//                 {volunteer.email}
//               </p>

//               <p>
//                 <strong>Branch:</strong>{" "}
//                 {volunteer.department}
//               </p>

//               <p>
//                 <strong>Year:</strong>{" "}
//                 {volunteer.year}
//               </p>

//               <p>
//                 <strong>Phone:</strong>{" "}
//                 {volunteer.phone}
//               </p>

//               {volunteer.committee && (
//                 <p>
//                   <strong>Committee:</strong>{" "}
//                   {volunteer.committee}
//                 </p>
//               )}

//             </div>


//             <div className="volunteer-status">

//               <span className="status-dot active"></span>

//               Active

//             </div>

//           </div>

//         ))}

//       </section>

//     </main>
//   );
// }

// export default Volunteers;
import { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  Users,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { users } from "../../mockData";

const STORAGE_KEY = "axonVolunteers";

function Volunteers() {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);

  const loadVolunteers = () => {
    const storedVolunteers =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Keep localStorage as the source of truth once it has been initialized.
    if (storedVolunteers.length > 0) {
      setVolunteers(storedVolunteers);
      return;
    }

    const mockVolunteers = users.filter(
      (user) => user.role === "volunteer"
    );

    setVolunteers(mockVolunteers);
  };

  useEffect(() => {
    const storedVolunteers = localStorage.getItem(STORAGE_KEY);

    if (!storedVolunteers) {
      const mockVolunteers = users.filter(
        (user) => user.role === "volunteer"
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(mockVolunteers)
      );
    }

    loadVolunteers();
  }, []);

  const handleEdit = (id) => {
    navigate(`/admin/add-volunteer?edit=${encodeURIComponent(id)}`);
  };

  const handleDelete = (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) {
      return;
    }

    const updatedVolunteers = volunteers.filter(
      (volunteer) => volunteer.id !== id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedVolunteers)
    );

    setVolunteers(updatedVolunteers);
  };

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Volunteer Management</h2>
          <p>View and manage all volunteers</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/admin/add-volunteer")}
        >
          <UserPlus size={16} />
          Add Volunteer
        </button>
      </div>

      <div className="volunteer-count">
        <Users size={18} />

        <span>
          <strong>{volunteers.length}</strong>{" "}
          Volunteers
        </span>
      </div>

      {volunteers.length === 0 ? (
        <div className="volunteer-empty-state">
          <Users size={36} />
          <h3>No volunteers found</h3>
          <p>Add a volunteer to get started.</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/admin/add-volunteer")}
          >
            <UserPlus size={16} />
            Add Volunteer
          </button>
        </div>
      ) : (
        <section className="volunteer-grid">
          {volunteers.map((volunteer) => (
            <div
              className="volunteer-card"
              key={volunteer.id}
            >
              <div className="volunteer-image">
                <img
                  src={
                    volunteer.profilePhoto ||
                    "/assets/images/profile/default.jpg"
                  }
                  alt={volunteer.fullName}
                />
              </div>

              <div className="volunteer-details">
                <h3>{volunteer.fullName}</h3>

                <p>
                  <strong>ID:</strong>{" "}
                  {volunteer.id}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {volunteer.email}
                </p>

                <p>
                  <strong>Branch:</strong>{" "}
                  {volunteer.department}
                </p>

                <p>
                  <strong>Year:</strong>{" "}
                  {volunteer.year}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {volunteer.phone}
                </p>

                {volunteer.committee && (
                  <p>
                    <strong>Committee:</strong>{" "}
                    {volunteer.committee}
                  </p>
                )}
              </div>

              <div className="volunteer-status-row">
                <div className="volunteer-status">
                  <span
                    className={`status-dot ${
                      volunteer.isActive === false
                        ? "inactive"
                        : "active"
                    }`}
                  ></span>

                  {volunteer.isActive === false
                    ? "Inactive"
                    : "Active"}
                </div>

                <div className="volunteer-actions">
                  <button
                    type="button"
                    className="volunteer-edit-button"
                    onClick={() =>
                      handleEdit(volunteer.id)
                    }
                    title="Edit volunteer"
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="volunteer-delete-button"
                    onClick={() =>
                      handleDelete(
                        volunteer.id,
                        volunteer.fullName
                      )
                    }
                    title="Delete volunteer"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

export default Volunteers;
