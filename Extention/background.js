chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: tab.url })
    });

    const data = await res.json();

    // Store full response
    chrome.storage.local.set({ analysis: data });

    // 🚫 BLOCK PHISHING
    if (data.result === "Phishing") {
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("warning.html")
      });
    }

  } catch (err) {
    console.log("Server error:", err);
  }
});