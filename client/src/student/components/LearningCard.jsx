import React from "react";

function LearningCard({ resource, onSelect }) {
  if (!resource) return null;

  return (
    <div className="learning-card">
      {resource.thumbnail && (
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className="learning-image"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}

      <div className="learning-content">
        <span className="learning-category">{resource.category}</span>

        <h3>{resource.title}</h3>
        <p>{resource.description}</p>

        <div className="learning-meta">
          <span>{resource.author}</span>
          <span>{resource.readTime}</span>
        </div>

        <button
          type="button"
          className="learning-button"
          onClick={() => onSelect && onSelect(resource)}
          style={{ border: "none", cursor: "pointer" }}
        >
          Read Resource
        </button>
      </div>
    </div>
  );
}

export default LearningCard;
