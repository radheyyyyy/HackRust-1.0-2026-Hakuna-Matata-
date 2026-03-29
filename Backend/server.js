const express = require("express");
const cors = require("cors");
const whois = require("whois-json");
const { spawn } = require("child_process");
const fs = require("fs");

let trancoSet = new Set();

function loadTrancoList() {
    try {
        const data = fs.readFileSync("F:/HackRust-1.0/Backend/top-1m.csv", "utf-8");;
        const lines = data.split("\n");

        for (let line of lines) {
            const parts = line.split(",");
            if (parts[1]) {
                trancoSet.add(parts[1].trim());
            }
        }

        console.log("✅ Tranco list loaded:", trancoSet.size);
    } catch (err) {
        console.log("❌ Failed to load Tranco list");
    }
}


const app = express();

app.use(cors());
app.use(express.json());

// =========================
// ERROR HANDLER
// =========================
app.use((err, _req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(400).json({
            error: "Invalid JSON format"
        });
    }
    next();
});

// =========================
// RULE ENGINE
// =========================
function ruleCheck(url) {
    let score = 0;
    let reasons = [];
    const lowerUrl = url.toLowerCase();

    // Existing
    if (url.length > 75) {
        score += 0.3;
        reasons.push("URL too long");
    }

    if (url.includes("@")) {
        score += 0.2;
        reasons.push("Contains '@'");
    }

    if (lowerUrl.includes("login") || lowerUrl.includes("verify")) {
        score += 0.3;
        reasons.push("Suspicious keywords");
    }

    if (!url.startsWith("https")) {
        score += 0.2;
        reasons.push("Not HTTPS");
    }

    // 🔥 New Strong Rules
    if (/[^\x00-\x7F]/.test(url)) {
        score += 0.5;
        reasons.push("Unicode detected");
    }

    if (url.includes("xn--")) {
        score += 0.5;
        reasons.push("Punycode detected");
    }

    if (/\d+\.\d+\.\d+\.\d+/.test(url)) {
        score += 0.4;
        reasons.push("IP address used");
    }

    if ((url.match(/\./g) || []).length > 4) {
        score += 0.3;
        reasons.push("Too many subdomains");
    }

    if (/\.(zip|review|country|kim|science|cricket)/.test(lowerUrl)) {
        score += 0.4;
        reasons.push("Suspicious TLD");
    }

    const brands = ["paypal", "google", "facebook", "amazon", "bank"];
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    for (let brand of brands) {
        if (hostname.includes(brand) && hostname !== `${brand}.com`) {
            score += 0.5;
            reasons.push(`Brand impersonation: ${brand}`);
            break;
        }
    }
    const numberMatches = url.match(/\d+/g);

    if (numberMatches) {
        if (numberMatches.length === 1) {
            score += 0.2;
            reasons.push("Contains numbers in URL");
        } else if (numberMatches.length > 1) {
            score += 0.5;
            reasons.push("Multiple numeric patterns in URL");
        }
    }
    return { score: Math.min(score, 1), reasons };
}

// =========================
// DOMAIN AGE
// =========================
async function getDomainAge(url) {
    try {
        const hostname = new URL(url).hostname;
        const domain = hostname.replace(/^www\./, "");

        const data = await Promise.race([
            whois(domain),
            new Promise((_, reject) => setTimeout(() => reject("timeout"), 3000))
        ]);

        const creation =
            data.creationDate ||
            data.createdDate ||
            data.domainCreated ||
            data.created ||
            null;
        if (!creation) return null;

        const ageDays = Math.floor(
            (new Date() - new Date(creation)) / (1000 * 60 * 60 * 24)
        );

        return ageDays;
    } catch {
        return null;
    }
}
// =========================
// Traffic Rank
// =========================
async function getTrafficRank(domain) {
    try {
        // ⚠️ For now we simulate (replace later with API)

        // Fake logic for testing
        if (domain.includes("google") || domain.includes("youtube")) {
            return 100; // very popular
        }

        if (domain.includes("amazon") || domain.includes("facebook")) {
            return 5000;
        }

        return 5000000; // unknown / low traffic
    } catch {
        return null;
    }
}

// =========================
// ML CALL
// =========================
function getMLPrediction(url) {
    return new Promise((resolve) => {
        const process = spawn("python", ["F:/HackRust-1.0/ML-Model/predict.py", url]);

        let output = "";

        process.stdout.on("data", (data) => {
            output += data.toString();
        });

        process.on("close", () => {
            const score = parseFloat(output.trim());

            if (isNaN(score)) {
                console.log("ML fallback used");
                resolve(0.7);
            } else {
                resolve(score);
            }
        });

        setTimeout(() => {
            process.kill();
            resolve(0.7);
        }, 5000);
    });
}


// =========================
// API Analyze
// =========================
app.post("/analyze", async (req, res) => {
    try {
        const { url } = req.body;


        if (!url) return res.status(400).json({ error: "URL required" });

        new URL(url); // validate

        const { score: rule_score, reasons } = ruleCheck(url);
        const domain_age = await getDomainAge(url);
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        const traffic_rank = await getTrafficRank(hostname);

        let age_score = 0.5;
        if (domain_age !== null) {
            if (domain_age < 30) age_score = 1;
            else if (domain_age < 180) age_score = 0.7;
            else if (domain_age < 365) age_score = 0.4;
            else age_score = 0.1;
        } else {
            age_score = 0.3; // neutral, not risky
            reasons.push("Domain age unavailable");
        }
        if (traffic_rank !== null) {
            if (traffic_rank < 100000) rank_score = 0.1;       // popular → safe
            else if (traffic_rank < 1000000) rank_score = 0.3; // medium
            else rank_score = 0.7;                             // low traffic → risky
        }
        let ml_score = await getMLPrediction(url);
        if (ml_score > 0.9 && rule_score < 0.2) {
            reasons.push("ML high but rules low → possible false positive");
            ml_score = 0.6;
        }

        // 🔥 Improved scoring
        final_score =
            (rule_score * 0.45) +
            (age_score * 0.2) +
            (ml_score * 0.25) +
            (rank_score * 0.1);

        if (rule_score >= 0.8) final_score += 0.1;
        if (ml_score >= 0.9) final_score += 0.1;

        final_score = Math.min(final_score, 1);

        let result = "Safe";
        if (final_score > 0.7) result = "Phishing";
        else if (final_score > 0.4) result = "Suspicious";

        res.json({
            url,
            result,
            final_score: final_score.toFixed(2),
            details: {
                rule_score,
                ml_score,
                domain_age,
                traffic_rank,
                reasons
            }
        });

    } catch {
        res.status(500).json({ error: "Server error" });
    }
});

// =========================
// START
// =========================
app.listen(5000, () => {
    loadTrancoList();
    console.log("🚀 Server running on http://localhost:5000");
});