import { useState, useEffect } from "react";
import "./pages.css";
import "./LearningHub.css";
import StudentLayout from "../layouts/StudentLayout";
import SearchBar from "../components/SearchBar/SearchBar";
import EmptyState from "../components/EmptyState/EmptyState";
import { fetchLearningResourcesApi, getLearningResources } from "../services/studentService";

function LearningHub() {
  const [learningResources, setLearningResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [readingResource, setReadingResource] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadResources() {
      try {
        setLoading(true);
        const data = await fetchLearningResourcesApi();
        if (isMounted && data && Array.isArray(data)) {
          const formatted = data.map((res) => ({
            resourceId: res._id || res.resourceId,
            _id: res._id,
            title: res.title,
            description: res.description || "",
            category: res.category ? (res.category.charAt(0).toUpperCase() + res.category.slice(1)) : "Article",
            rawCategory: res.category || "article",
            contentType: res.contentType || "article",
            content: res.content || "",
            pdfUrl: res.pdfUrl || "",
            externalUrl: res.externalUrl || res.resourceLink || "",
            imageUrl: res.imageUrl || "",
            videoUrl: res.videoUrl || "",
            thumbnail: res.thumbnail || res.imageUrl || "",
            readTime: res.readTime || "5 min read",
            tags: res.tags || [],
            isFeatured: Boolean(res.isFeatured),
            author: res.author || "TCF Editorial Team",
            publishedDate: res.publishedDate
              ? new Date(res.publishedDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent",
          }));
          setLearningResources(formatted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load learning resources from API:", err.message);
      }

      if (isMounted) {
        setLearningResources([]);
        setLoading(false);
      }
    }

    loadResources();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    "All",
    ...new Set(learningResources.map((resource) => resource.category)),
  ];

  const filteredResources = learningResources.filter((resource) => {
    const matchesCategory =
      selectedCategory === "All" ||
      resource.category === selectedCategory ||
      resource.rawCategory === selectedCategory.toLowerCase();

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
          {loading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              Loading learning articles and cybersecurity resources...
            </div>
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <div className="learning-card" key={resource.resourceId || resource._id}>
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
                {readingResource.content ? (
                  <p>{readingResource.content}</p>
                ) : (
                  <>
                    <p>
                      This educational material is curated by The Cyber Force (TCF) technical committee to provide practical cybersecurity knowledge for students at Vishwakarma Government Engineering College.
                    </p>
                    <p>
                      Key learning points include identifying attack vectors, understanding proactive defensive measures, and implementing security best practices in academic and real-world projects.
                    </p>
                  </>
                )}
              </div>

              {readingResource.externalUrl && readingResource.externalUrl !== "#" && (
                <div style={{ marginTop: "16px" }}>
                  <a
                    href={readingResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      background: "#6a3bc5",
                      color: "#ffffff",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    Open External Resource ↗
                  </a>
                </div>
              )}

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