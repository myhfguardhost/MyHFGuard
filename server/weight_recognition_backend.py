import sys, json, re, cv2, numpy as np

try:
    import pytesseract
    HAS_TESSERACT = True
except Exception:
    HAS_TESSERACT = False


def output(data, code=0):
    print(json.dumps(data))
    sys.exit(code)


def parse_weight(text):
    text = str(text)
    text = text.replace(",", ".")
    text = text.replace("O", "0").replace("o", "0")
    text = text.replace("l", "1").replace("I", "1")

    found = re.findall(r"\d{2,3}(?:\.\d{1,2})?|\d{3,4}", text)

    candidates = []

    for item in found:
        try:
            if "." in item:
                value = float(item)
            else:
                raw = int(item)

                if 200 <= raw <= 999:
                    value = raw / 10.0      # 464 -> 46.4
                elif 2000 <= raw <= 30000:
                    value = raw / 100.0     # 4640 -> 46.40
                else:
                    value = float(raw)

            if 20 <= value <= 300:
                candidates.append(value)
        except:
            pass

    return candidates[0] if candidates else None


def crop_candidates(img):
    h, w = img.shape[:2]
    candidates = []

    candidates.append(("full", img))
    candidates.append(("middle", img[int(h * 0.20):int(h * 0.90), int(w * 0.02):int(w * 0.98)]))
    candidates.append(("display_area", img[int(h * 0.30):int(h * 0.85), int(w * 0.05):int(w * 0.95)]))

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    masks = [
        ("blue_green", cv2.inRange(hsv, np.array([45, 15, 35]), np.array([130, 255, 255]))),
        ("dark_screen", cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 100, 120]))),
        ("grey_screen", cv2.inRange(hsv, np.array([0, 0, 40]), np.array([180, 90, 230]))),
    ]

    for name, mask in masks:
        kernel = np.ones((9, 9), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.dilate(mask, kernel, iterations=1)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
            x, y, cw, ch = cv2.boundingRect(c)

            if cw > 80 and ch > 30:
                pad = 25
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(w, x + cw + pad)
                y2 = min(h, y + ch + pad)

                crop = img[y1:y2, x1:x2]

                if crop.size > 0:
                    candidates.append((name, crop))

    return candidates


def preprocess_variants(crop):
    variants = []

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)

    variants.append(("gray", gray))

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    variants.append(("clahe", clahe))

    blur = cv2.GaussianBlur(clahe, (3, 3), 0)

    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(("otsu", otsu))

    _, otsu_inv = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    variants.append(("otsu_inv", otsu_inv))

    adaptive = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        5
    )
    variants.append(("adaptive", adaptive))

    adaptive_inv = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        5
    )
    variants.append(("adaptive_inv", adaptive_inv))

    # bright LED extraction
    _, bright = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3, 3), np.uint8)
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, kernel)
    variants.append(("bright_led", bright))

    return variants


def tesseract_ocr(img):
    if not HAS_TESSERACT:
        return []

    results = []

    for psm in [7, 8, 6, 13]:
        try:
            text = pytesseract.image_to_string(
                img,
                config=f"--psm {psm} -c tessedit_char_whitelist=0123456789."
            )
            results.append(text)
        except Exception as e:
            results.append(str(e))

    return results


def detect_weight(image_path):
    img = cv2.imread(image_path)

    if img is None:
        return None, "image read failed", []

    attempts = []

    for crop_name, crop in crop_candidates(img):
        for prep_name, processed in preprocess_variants(crop):
            texts = tesseract_ocr(processed)

            for text in texts:
                weight = parse_weight(text)

                attempts.append({
                    "crop": crop_name,
                    "method": prep_name,
                    "rawText": text.strip(),
                    "value": weight
                })

                if weight:
                    return weight, text.strip(), attempts

            # OpenCV fallback: find white digit blobs and guess text without decimal
            contours, _ = cv2.findContours(processed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            boxes = []

            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                area = w * h

                if area > 100 and h > 20 and w > 5:
                    boxes.append((x, y, w, h))

            boxes = sorted(boxes, key=lambda b: b[0])

            if len(boxes) >= 2:
                raw_guess = "".join(["8" for _ in boxes[:4]])
                attempts.append({
                    "crop": crop_name,
                    "method": prep_name + "_blob_fallback",
                    "rawText": raw_guess,
                    "value": None
                })

    return None, "", attempts


if len(sys.argv) < 2:
    output({"error": "No image path provided"}, 1)

image_path = sys.argv[1]

weight, raw_text, attempts = detect_weight(image_path)

if weight is not None:
    output({
        "weight": f"{weight:.1f}",
        "detectedWeight": f"{weight:.1f}",
        "rawText": raw_text,
        "allAttempts": attempts
    }, 0)

output({
    "error": "Weight not detected",
    "rawText": raw_text,
    "allAttempts": attempts
}, 1)