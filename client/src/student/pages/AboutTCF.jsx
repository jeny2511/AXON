import StudentLayout from "../layouts/StudentLayout";
import { getAboutTCF } from "../services/studentService";
import "./AboutTCF.css";

function AboutTCF() {
  const aboutTCF = getAboutTCF();

  return (
    <StudentLayout>

      <div className="about-tcf-page">

        <h1 className="page-title">About TCF</h1>

        {/* How TCF Started */}
        <section className="about-section">
          <h2>{aboutTCF.history.title}</h2>
          <p>{aboutTCF.history.description}</p>
        </section>

        {/* Vision */}
        <section className="about-section">
          <h2>{aboutTCF.vision.title}</h2>
          <p>{aboutTCF.vision.description}</p>
        </section>

        {/* Mentor */}
        <section className="about-section">
          <h2>Our Mentor</h2>

          <div className="person-card">
            <div className="person-image">
              {aboutTCF.mentor.image ? (
                <img
                  src={aboutTCF.mentor.image}
                  alt={aboutTCF.mentor.name}
                />
              ) : (
                <span>Photo</span>
              )}
            </div>

            <div>
              <h3>{aboutTCF.mentor.name}</h3>
              <p>{aboutTCF.mentor.role}</p>
            </div>
          </div>
        </section>

        {/* Core Team */}
        <section className="about-section">
          <h2>Core Team</h2>

          <div className="team-grid">

            {aboutTCF.coreTeam.map((member, index) => (
              <div className="person-card" key={index}>

                <div className="person-image">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name || member.role}
                    />
                  ) : (
                    <span>Photo</span>
                  )}
                </div>

                <div>
                  <h3>{member.name || "To Be Decided"}</h3>
                  <p>{member.role}</p>
                </div>

              </div>
            ))}

          </div>
        </section>

      </div>

    </StudentLayout>
  );
}

export default AboutTCF;