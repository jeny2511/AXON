import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { users } from "../../mockData";

function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    const mockVolunteers = users.filter(
      (user) => user.role === "volunteer"
    );

    const addedVolunteers =
      JSON.parse(
        localStorage.getItem("axonVolunteers")
      ) || [];

    setVolunteers([
      ...mockVolunteers,
      ...addedVolunteers,
    ]);
  }, []);

  return (
    <main className="dashboard">

      <div className="page-heading">

        <div>
          <h2>Volunteer Management</h2>

          <p>
            View and manage all volunteers
          </p>
        </div>

      </div>


      <div className="volunteer-count">

        <Users size={18} />

        <span>
          <strong>
            {volunteers.length}
          </strong>{" "}
          Volunteers
        </span>

      </div>


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

              <h3>
                {volunteer.fullName}
              </h3>

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


            <div className="volunteer-status">

              <span className="status-dot active"></span>

              Active

            </div>

          </div>

        ))}

      </section>

    </main>
  );
}

export default Volunteers;