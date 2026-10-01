import "./SearchBar.css";

function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
}) {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default SearchBar;