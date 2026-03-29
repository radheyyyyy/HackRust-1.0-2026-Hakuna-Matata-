import { useState } from "react";

function UrlForm({ setData }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      });

      const result = await res.json();
      setData(result);

    } catch (err) {
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="form">
      <input
        type="text"
        placeholder="Enter URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {loading ? "Scanning..." : "Scan"}
      </button>
    </div>
  );
}

export default UrlForm;