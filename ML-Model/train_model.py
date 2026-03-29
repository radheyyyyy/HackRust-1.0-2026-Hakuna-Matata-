import pandas as pd
import joblib
import unicodedata
import math
import re
from urllib.parse import urlparse
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# =========================
# LOAD DATASET
# =========================
data = pd.read_csv(r"F:\HackRust-1.0\ML-Model\dataset.csv")
data.columns = data.columns.str.lower()

# =========================
# HELPER FUNCTIONS
# =========================

def has_suspicious_unicode(url):
    for char in url:
        try:
            char.encode('ascii')
        except UnicodeEncodeError:
            return 1
    return 0

def has_homograph_attack(url):
    normalized = unicodedata.normalize('NFKD', url)
    return int(normalized != url)

def entropy(s):
    if len(s) == 0:
        return 0
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum([p * math.log2(p) for p in prob])

def has_ip_address(url):
    return int(bool(re.search(r'\d+\.\d+\.\d+\.\d+', url)))

def suspicious_tld(url):
    return int(any(tld in url for tld in [
        '.zip', '.review', '.country', '.kim', '.cricket', '.science'
    ]))

def brand_mismatch(url):
    brands = [ 'google', 'bank', 'facebook', 'amazon']
    for brand in brands:
        if brand in url and not url.startswith(f"https://www.{brand}.com"):
            return 1
    return 0

# =========================
# FEATURE EXTRACTION
# =========================

def extract_features(url):
    url = str(url).lower()
    parsed = urlparse(url)
    domain = parsed.netloc

    unicode_flag = has_suspicious_unicode(url)
    homograph_flag = has_homograph_attack(url)

    return [
        
        len(url),
        url.count('.'),
        url.count('-'),
        url.count('@'),
        url.count('?'),
        url.count('='),
        url.count('http'),

        int(url.startswith('https')),
        int('login' in url),
        int('verify' in url),
        int('secure' in url),

        int('bank' in url),
        int('account' in url),

        int('.xyz' in url),
        int('.tk' in url),
        int('.ml' in url),

        int(url.count('.') > 3),
        int(len(url) > 60),

        int(any(char.isdigit() for char in url)),
        int('//' in url[8:]),
        int('%' in url),

        # ===== DATASET-INSPIRED FEATURES =====
        len(domain),
        sum(c.isdigit() for c in url),  # noofdigitsinurl
        sum(c.isdigit() for c in url) / len(url) if len(url) > 0 else 0,
        sum(not c.isalnum() for c in url) / len(url) if len(url) > 0 else 0,
        int('%' in url or '//' in url[8:]),  # hasobfuscation

        unicode_flag,
        homograph_flag,
        int(unicode_flag or homograph_flag),  
        int('xn--' in url),                   
        has_ip_address(url),
        suspicious_tld(url),
        brand_mismatch(url),
        url.count('/'),
        entropy(domain),
    ]

# =========================
# PREPARE DATA
# =========================

X = data['url'].apply(extract_features).tolist()
y = data['label']

# =========================
# SCALING
# =========================

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# =========================
# MODEL TRAINING
# =========================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    class_weight='balanced',
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# EVALUATION
# =========================

y_pred = model.predict(X_test)

print(f"\n✅ Accuracy: {accuracy_score(y_test, y_pred):.4f}\n")
print("📊 Classification Report:")
print(classification_report(y_test, y_pred))

# =========================
# SAVE MODEL
# =========================

joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("\n💾 Model and scaler saved successfully!")
