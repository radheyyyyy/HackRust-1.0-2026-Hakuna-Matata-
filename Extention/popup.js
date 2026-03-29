chrome.storage.local.get(["analysis"], function (data) {
  const el = document.getElementById("status");

  if (!data.analysis) {
    el.innerText = "No data";
    return;
  }

  const { result, final_score, details } = data.analysis;

  el.innerHTML = `
    <b>Status:</b> ${result}<br>
    <b>Score:</b> ${final_score}<br><br>
    <b>Reasons:</b><br>
    ${details.reasons.join("<br>")}
  `;
});