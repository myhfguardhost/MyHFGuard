import sys, json, re, cv2, numpy as np, pytesseract

def parse_weight(text):
    text = text.replace(",", ".").replace("O", "0").replace("o", "0")
    nums = re.findall(r"\d{2,3}(?:\.\d{1,2})?|\d{3,4}", text)

    for n in nums:
        try:
            if "." in n:
                v = float(n)
            else:
                raw = int(n)
                if 300 <= raw <= 999:
                    v = raw / 10
                elif 2000 <= raw <= 30000:
                    v = raw / 100
                else:
                    v = float(raw)

            if 20 <= v <= 300:
                return v
        except:
            pass

    return None


def crop_display_candidates(img):
    candidates = [img]
    h, w = img.shape[:2]

    candidates.append(img[int(h*0.25):int(h*0.85), int(w*0.05):int(w*0.95)])
    candidates.append(img[int(h*0.35):int(h*0.80), int(w*0.10):int(w*0.90)])

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    masks = [
        cv2.inRange(hsv, np.array([35, 15, 40]), np.array([120, 255, 255])),
        cv2.inRange(hsv, np.array([80, 10, 40]), np.array([140, 255, 255])),
        cv2.inRange(hsv, np.array([0, 0, 40]), np.array([180, 80, 220])),
    ]

    for mask in masks:
        kernel = np.ones((9, 9), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for c in sorted(contours, key=cv2.contourArea, reverse=True)[:3]:
            x, y, cw, ch = cv2.boundingRect(c)
            if cw > 80 and ch > 35:
                pad = 20
                x1, y1 = max(0, x-pad), max(0, y-pad)
                x2, y2 = min(w, x+cw+pad), min(h, y+ch+pad)
                candidates.append(img[y1:y2, x1:x2])

    return candidates


def preprocess_variants(img):
    out = []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)

    for base in [gray, clahe]:
        blur = cv2.GaussianBlur(base, (3, 3), 0)

        _, th1 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        _, th2 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        th3 = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 5
        )

        th4 = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 31, 5
        )

        out.extend([base, th1, th2, th3, th4])

    return out


def detect_weight(image_path):
    img = cv2.imread(image_path)

    if img is None:
        return None, "Unable to read image"

    all_text = ""

    for candidate in crop_display_candidates(img):
        for processed in preprocess_variants(candidate):
            for psm in [7, 8, 6, 13]:
                try:
                    text = pytesseract.image_to_string(
                        processed,
                        config=f"--psm {psm} -c tessedit_char_whitelist=0123456789."
                    )

                    all_text += " " + text
                    weight = parse_weight(text)

                    if weight:
                        return weight, text.strip()
                except Exception as e:
                    all_text += " " + str(e)

    return None, all_text.strip()


if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]
weight, raw_text = detect_weight(image_path)

if weight:
    print(json.dumps({
        "weight": round(float(weight), 1),
        "detectedWeight": round(float(weight), 1),
        "rawText": raw_text
    }))
    sys.exit(0)

print(json.dumps({
    "error": "Weight not detected",
    "rawText": raw_text
}))
sys.exit(1)