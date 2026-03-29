import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  const handleCheck = async () => {
    if (!url) {
      setMessage("Please enter a URL");
      return;
    }

    try {
      setMessage("Checking...");
      setData(null);

      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.error) {
        setMessage("Error: " + result.error);
      } else {
        setData(result);
        setMessage("");
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
  };

  // 🎯 Confidence %
  const confidence = data ? Math.round(data.final_score * 100) : 0;

  // 🎯 Color based on result
  const getColor = () => {
    if (!data) return "#000";
    if (data.result === "Safe") return "#28a745";
    if (data.result === "Suspicious") return "#ffc107";
    if (data.result === "Phishing") return "#dc3545";
    return "#000";
  };

  return (
    <div style={styles.container}>
      <h1>🔐 Phishing URL Detector</h1>

      <input
        type="text"
        placeholder="Enter URL here..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleCheck} style={styles.button}>
        Check URL
      </button>

      {message && (
        <div style={styles.resultBox}>
          <p>{message}</p>
        </div>
      )}

      {data && (
        <div style={styles.resultBox}>
          <p>
            <strong>{data.result}</strong> (Score: {data.final_score})
          </p>

          {/* 📊 Confidence Meter */}
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${confidence}%`,
                backgroundColor: getColor(),
              }}
            />
          </div>

          <p>Confidence: {confidence}%</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px",
    fontFamily: "Arial",
  },
  input: {
    width: "350px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "12px 25px",
    marginLeft: "10px",
    borderRadius: "8px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "10px",
    backgroundColor: "#f1f1f1",
    display: "inline-block",
  },

  // ✅ Meter styles added
  progressBar: {
    width: "100%",
    height: "10px",
    backgroundColor: "#eee",
    borderRadius: "5px",
    overflow: "hidden",
    marginTop: "10px",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.5s ease",
  },
};

export default App;