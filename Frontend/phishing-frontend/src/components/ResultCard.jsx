function ResultCard({ data }) {
  const { result, final_score, details } = data;

  let color = "green";
  if (result === "Suspicious") color = "orange";
  if (result === "Phishing") color = "red";

  return (
    <div className="card" style={{ borderColor: color }}>
      
      <h2 style={{ color }}>{result}</h2>
      <p><b>Confidence Score:</b> {final_score}</p>

      <div className="section">
        <h3>🔍 Breakdown</h3>
        <p>Rule Score: {details.rule_score}</p>
        <p>ML Score: {details.ml_score}</p>
        <p>Domain Age: {details.domain_age || "Unknown"}</p>
        <p>Traffic Rank: {details.traffic_rank}</p>
      </div>

      <div className="section">
        <h3>⚠️ Reasons</h3>
        <ul>
          {details.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default ResultCard;