import sys
import json
import re
import cv2
import numpy as np
import pytesseract


def clean_weight(text):
    text = text.replace(",", ".")
    text = text.replace("O", "0").replace("o", "0")

    matches = re.findall(r"\d{2,3}\.\d{1,2}|\d{3,4}|\d{2,3}", text)

    candidates = []

    for m in matches:
        try:
            if "." in m:
                value = float(m)
            else:
                raw = int(m)

                if 300 <= raw <= 999:
                    value = raw / 10      # 464 -> 46.4
                elif 3000 <= raw <= 9999:
                    value = raw / 100     # 6405 -> 64.05
                else:
                    value = float(raw)

            if 20 <= value <= 300:
                candidates.append(value)
        except:
            pass

    if not candidates:
        return None

    return candidates[0]


def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    thresh = cv2.threshold(
        blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    return thresh


def extract_weight(image_path):
    image = cv2.imread(image_path)

    if image is None:
        return {
            "error": True,
            "message": "Unable to read image"
        }

    attempts = []

    # Attempt 1: normal OCR
    processed = preprocess_image(image)

    text = pytesseract.image_to_string(
        processed,
        config="--psm 7 -c tessedit_char_whitelist=0123456789."
    )

    attempts.append(text)

    weight = clean_weight(text)

    if weight is not None:
        return {
            "error": False,
            "weight": round(weight, 2),
            "rawText": text,
            "allAttempts": attempts
        }

    # Attempt 2: grayscale fallback
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    text2 = pytesseract.image_to_string(
        gray,
        config="--psm 7 -c tessedit_char_whitelist=0123456789."
    )

    attempts.append(text2)

    weight2 = clean_weight(text2)

    if weight2 is not None:
        return {
            "error": False,
            "weight": round(weight2, 2),
            "rawText": text2,
            "allAttempts": attempts
        }

    return {
        "error": True,
        "message": "Weight not detected",
        "rawText": text + "\n" + text2,
        "allAttempts": attempts
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": True,
            "message": "No image path provided"
        }))
        sys.exit(1)

    result = extract_weight(sys.argv[1])
    print(json.dumps(result))