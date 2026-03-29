chrome.storage.local.get(["analysis"], function (data) {
  if (!data.analysis) return;

  const { result, final_score, details } = data.analysis;

  let color = "green";
  if (result === "Suspicious") color = "orange";
  if (result === "Phishing") color = "red";

  const box = document.createElement("div");

  box.innerHTML = `
    <strong> Security Check</strong><br>
    Status: ${result}<br>
    Score: ${final_score}<br>
    Reasons: ${details.reasons.slice(0, 2).join(", ")}
  `;

  box.style.position = "fixed";
  box.style.top = "20px";
  box.style.right = "20px";
  box.style.padding = "12px";
  box.style.background = color;
  box.style.color = "white";
  box.style.zIndex = "9999";
  box.style.borderRadius = "8px";
  box.style.fontSize = "12px";

  document.body.appendChild(box);
});