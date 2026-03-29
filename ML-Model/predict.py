import sys
import joblib
import unicodedata
import math
import re
from urllib.parse import urlparse

# =========================
# LOAD MODEL
# =========================
try:
    model = joblib.load(r"F:\HackRust-1.0\ML-Model\model.pkl")
    scaler = joblib.load(r"F:\HackRust-1.0\ML-Model\scaler.pkl")
except Exception as e:
    print(0.7)
    sys.exit(0)

# =========================
# HELPER FUNCTIONS
# =========================

def has_suspicious_unicode(url):
    try:
        url.encode('ascii')
        return 0
    except:
        return 1

def has_homograph_attack(url):
    try:
        normalized = unicodedata.normalize('NFKD', url)
        return int(normalized != url)
    except:
        return 0

def entropy(s):
    try:
        if len(s) == 0:
            return 0
        prob = [float(s.count(c)) / len(s) for c in set(s)]
        return -sum([p * math.log2(p) for p in prob])
    except:
        return 0

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

        len(domain),
        sum(c.isdigit() for c in url),
        sum(c.isdigit() for c in url) / len(url) if len(url) > 0 else 0,
        sum(not c.isalnum() for c in url) / len(url) if len(url) > 0 else 0,
        int('%' in url or '//' in url[8:]),

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
# MAIN
# =========================

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            print(0.7)
            sys.exit(0)

        url = sys.argv[1]

        if not url.startswith("http"):
            print(0.7)
            sys.exit(0)

        features = extract_features(url)
        features_scaled = scaler.transform([features])

        prob = model.predict_proba(features_scaled)[0][1]

        print(round(float(prob), 4))

    except Exception as e:
        print(0.7)