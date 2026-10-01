import { useState } from "react";
import "./pages.css";
import "./LearningHub.css";
import StudentLayout from "../layouts/StudentLayout";
import SearchBar from "../components/SearchBar/SearchBar";
import EmptyState from "../components/EmptyState/EmptyState";
import { getLearningResources } from "../services/studentService";

function LearningHub() {
  const learningResources = getLearningResources();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [readingResource, setReadingResource] = useState(null);

  const categories = [
    "All",
    ...new Set(learningResources.map((resource) => resource.category)),
  ];

  const filteredResources = learningResources.filter((resource) => {
    const matchesCategory =
      selectedCategory === "All" ||
      resource.category === selectedCategory;

    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      resource.title?.toLowerCase().includes(term) ||
      resource.description?.toLowerCase().includes(term) ||
      resource.tags?.some((t) => t.toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  return (
    <StudentLayout>
      <div className="learning-hub-page">
        <div className="page-container">
          <h1 className="page-title">Learning Hub</h1>
          <p className="page-subtitle">
            Explore curated cybersecurity news, research papers, case studies, and practical tutorials.
          </p>
        </div>

        <div style={{ maxWidth: "600px", marginBottom: "16px" }}>
          <SearchBar
            placeholder="Search learning resources, topics, tools..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="learning-categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="learning-grid">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <div className="learning-card" key={resource.resourceId}>
                {resource.thumbnail && (
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="learning-image"
                    onError={(event) => {
                      event.target.style.display = "none";
                    }}
                  />
                )}

                <div className="learning-content">
                  <span className="learning-category">{resource.category}</span>

                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>

                  <div className="learning-meta">
                    <span>By {resource.author}</span>
                    <span>⏱ {resource.readTime}</span>
                  </div>

                  <button
                    type="button"
                    className="learning-button"
                    style={{ border: "none", cursor: "pointer", width: "100%" }}
                    onClick={() => setReadingResource(resource)}
                  >
                    Read Resource
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                title="No Learning Resources Found"
                message={
                  search || selectedCategory !== "All"
                    ? "No resources match your active search filters. Try selecting another category."
                    : "Learning resources will appear here."
                }
              />
            </div>
          )}
        </div>

        {/* Resource Reader Modal */}
        {readingResource && (
          <div
            className="feedback-modal-overlay"
            onClick={() => setReadingResource(null)}
            style={{ zIndex: 10000 }}
          >
            <div
              className="feedback-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "680px", maxHeight: "85vh", overflowY: "auto" }}
            >
              <button
                type="button"
                className="feedback-close"
                onClick={() => setReadingResource(null)}
                aria-label="Close"
              >
                ×
              </button>

              <span className="learning-category">{readingResource.category}</span>
              <h2 style={{ color: "#1f1f29", margin: "10px 0" }}>{readingResource.title}</h2>
              <div className="learning-meta" style={{ marginBottom: "16px" }}>
                <span>Author: {readingResource.author}</span>
                <span>Published: {readingResource.publishedDate}</span>
                <span>Estimated Read: {readingResource.readTime}</span>
              </div>

              {readingResource.thumbnail && (
                <img
                  src={readingResource.thumbnail}
                  alt={readingResource.title}
                  style={{ width: "100%", maxHeight: "240px", objectFit: "cover", borderRadius: "10px", marginBottom: "18px" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}

              <div style={{ color: "#334155", lineHeight: 1.8, fontSize: "15px" }}>
                <p><strong>Summary:</strong> {readingResource.description}</p>
                <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />
                <p>
                  This educational material is curated by The Cyber Force (TCF) technical committee to provide practical cybersecurity knowledge for students at Vishwakarma Government Engineering College.
                </p>
                <p>
                  Key learning points include identifying attack vectors, understanding proactive defensive measures, and implementing security best practices in academic and real-world projects.
                </p>
              </div>

              {readingResource.tags && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "18px" }}>
                  {readingResource.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "#f0ebfa",
                        color: "#6a3bc5",
                        fontSize: "12px",
                        padding: "3px 9px",
                        borderRadius: "12px",
                        fontWeight: "600",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "24px", textAlign: "right" }}>
                <button
                  type="button"
                  className="rulebook-button"
                  onClick={() => setReadingResource(null)}
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default LearningHub;