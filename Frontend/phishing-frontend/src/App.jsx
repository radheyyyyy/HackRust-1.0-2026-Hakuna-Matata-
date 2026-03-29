import { useState } from "react";
import UrlForm from "./components/UrlForm";
import ResultCard from "./components/ResultCard";
import "./styles.css";

function App() {
  const [data, setData] = useState(null);

  return (
    <div className="container">
      <h1>🔐 AI Phishing Detector</h1>
      <UrlForm setData={setData} />
      {data && <ResultCard data={data} />}
    </div>
  );
}

export default App;