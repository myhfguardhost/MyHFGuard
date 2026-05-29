import sys
import os
import cv2
import pytesseract
import json
import re
import numpy as np
import base64

if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def output(data, code=0):
    print(json.dumps(data))
    sys.exit(code)


def normalize_text(text):
    if not text:
        return ""
    return (
        text.strip()
        .replace("O", "0")
        .replace("o", "0")
        .replace("B", "8")
        .replace("b", "8")
        .replace("S", "5")
        .replace("s", "5")
        .replace(",", ".")
        .replace(" ", "")
    )


def extract_candidates(text):
    text = normalize_text(text)
    values = []

    matches = re.findall(r"\d{2,3}\.\d{1,2}", text)
    for m in matches:
        try:
            v = float(m)
            if 20 <= v <= 300:
                values.append(v)
        except:
            pass

    digit_groups = re.findall(r"\d{4}", text)
    for g in digit_groups:
        try:
            v = float(g[:2] + "." + g[2:])
            if 20 <= v <= 300:
                values.append(v)
        except:
            pass

    digit_groups_3 = re.findall(r"\d{3}", text)
    for g in digit_groups_3:
        try:
            v = float(g[:2] + "." + g[2:])
            if 20 <= v <= 300:
                values.append(v)
        except:
            pass

    return values


def get_regions(img):
    h, w = img.shape[:2]
    regions = []

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lower_blue = np.array([85, 30, 30])
    upper_blue = np.array([155, 255, 255])
    mask = cv2.inRange(hsv, lower_blue, upper_blue)

    kernel = np.ones((7, 7), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.dilate(mask, kernel, iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        area = bw * bh
        if area > 800 and bw > bh:
            boxes.append((x, y, bw, bh, area))

    boxes = sorted(boxes, key=lambda b: b[4], reverse=True)

    if boxes:
        x, y, bw, bh, _ = boxes[0]

        pad_x = int(bw * 0.12)
        pad_y = int(bh * 0.35)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w, x + bw + pad_x)
        y2 = min(h, y + bh + pad_y)

        display = img[y1:y2, x1:x2]
        dh, dw = display.shape[:2]

        main_digits = display[:, :int(dw * 0.72)]

        regions.append(("main_digits", main_digits))
        regions.append(("display", display))

    center = img[int(h * 0.20):int(h * 0.85), int(w * 0.03):int(w * 0.97)]
    regions.append(("center", center))
    regions.append(("full", img))

    return regions


def preprocess_variants(img):
    variants = []

    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    eq = cv2.equalizeHist(blur)

    kernel_sharp = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp = cv2.filter2D(eq, -1, kernel_sharp)

    _, otsu = cv2.threshold(eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _, inv_otsu = cv2.threshold(eq, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    adaptive = cv2.adaptiveThreshold(
        eq, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 3
    )
    adaptive_inv = cv2.adaptiveThreshold(
        eq, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 3
    )

    variants.append(("gray", gray))
    variants.append(("eq", eq))
    variants.append(("sharp", sharp))
    variants.append(("otsu", otsu))
    variants.append(("inv_otsu", inv_otsu))
    variants.append(("adaptive", adaptive))
    variants.append(("adaptive_inv", adaptive_inv))

    return variants


def run_ocr(img):
    configs = [
        r"--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789.",
        r"--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789.",
        r"--oem 3 --psm 13 -c tessedit_char_whitelist=0123456789.",
        r"--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789.",
    ]

    results = []
    for cfg in configs:
        try:
            txt = pytesseract.image_to_string(img, config=cfg).strip()
            txt = normalize_text(txt)
            results.append((cfg, txt))
        except Exception as e:
            results.append((cfg, f"OCR_ERROR:{str(e)}"))

    return results


def score_candidate(value, text, region_name):
    score = 0

    if 30 <= value <= 200:
        score += 50

    if "." in text:
        score += 30

    if region_name == "main_digits":
        score += 50
    elif region_name == "display":
        score += 30
    elif region_name == "center":
        score += 10

    if value < 25:
        score -= 50

    if value > 250:
        score -= 50

    return score


if len(sys.argv) < 2:
    output({"error": "No image path provided"}, 1)

image_path = sys.argv[1]
img = cv2.imread(image_path)

if img is None:
    output({"error": "Image not found"}, 1)

all_attempts = []
best = None
best_region_image = None

try:
    regions = get_regions(img)

    for region_name, region_img in regions:
        variants = preprocess_variants(region_img)

        for variant_name, variant_img in variants:
            ocr_results = run_ocr(variant_img)

            for cfg, txt in ocr_results:
                candidates = extract_candidates(txt)

                all_attempts.append({
                    "region": region_name,
                    "variant": variant_name,
                    "config": cfg,
                    "text": txt,
                    "candidates": candidates,
                })

                for value in candidates:
                    s = score_candidate(value, txt, region_name)

                    if best is None or s > best["score"]:
                        best = {
                            "weight": value,
                            "score": s,
                            "rawText": txt,
                            "region": region_name,
                            "variant": variant_name,
                            "config": cfg,
                        }
                        best_region_image = region_img.copy()

except Exception as e:
    output({"error": f"Processing failed: {str(e)}"}, 1)

annotated_b64 = None
if best_region_image is not None:
    try:
        success, buffer = cv2.imencode(".jpg", best_region_image)
        if success:
            annotated_b64 = base64.b64encode(buffer).decode("utf-8")
    except:
        annotated_b64 = None

if best:
    output({
        "weight": f"{best['weight']:.1f}",
        "detectedWeight": f"{best['weight']:.1f}",
        "rawText": best["rawText"],
        "region": best["region"],
        "variant": best["variant"],
        "annotatedImage": annotated_b64,
        "allAttempts": all_attempts
    }, 0)
else:
    output({
        "error": "Weight not detected",
        "rawText": "",
        "allAttempts": all_attempts
    }, 1)