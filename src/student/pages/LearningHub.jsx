import { useState } from "react";

import StudentLayout from "../layouts/StudentLayout";
import SearchBar from "../components/SearchBar/SearchBar";

import {
  getLearningResources,
} from "../services/studentService";

import "./LearningHub.css";

function LearningHub() {
  const learningResources = getLearningResources();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    ...new Set(
      learningResources.map((resource) => resource.category)
    ),
  ];

  const filteredResources = learningResources.filter((resource) => {
    const matchesCategory =
      selectedCategory === "All" ||
      resource.category === selectedCategory;

    const matchesSearch =
      resource.title.toLowerCase().includes(search.toLowerCase()) ||
      resource.description.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <StudentLayout>

      <div className="learning-hub-page">

        <h1 className="page-title">Learning Hub</h1>

        <p className="page-subtitle">
          Explore cybersecurity resources, research, case studies, and awareness material.
        </p>

        <SearchBar
          placeholder="Search learning resources..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="learning-categories">
          {categories.map((category) => (
            <button
              key={category}
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

                  <span className="learning-category">
                    {resource.category}
                  </span>

                  <h3>{resource.title}</h3>

                  <p>{resource.description}</p>

                  <div className="learning-meta">
                    <span>{resource.author}</span>
                    <span>{resource.readTime}</span>
                  </div>

                  <a
                    href={resource.resourceLink}
                    className="learning-button"
                  >
                    Read Resource
                  </a>

                </div>

              </div>
            ))
          ) : (
            <p>No learning resources found.</p>
          )}

        </div>

      </div>

    </StudentLayout>
  );
}

export default LearningHub;