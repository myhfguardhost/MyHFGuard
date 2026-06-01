import sys, json, cv2, numpy as np, re
import pytesseract

def output(data, code=0):
    print(json.dumps(data))
    sys.exit(code)

def clean_weight(text):
    text = text.replace(",", ".").replace("O", "0").replace("o", "0")
    nums = re.findall(r"\d{2,3}\.\d{1,2}|\d{3,4}|\d{2,3}", text)

    for n in nums:
        try:
            if "." in n:
                v = float(n)
            else:
                raw = int(n)
                if 3000 <= raw <= 9999:
                    v = raw / 100      # 6405 -> 64.05
                elif 300 <= raw <= 999:
                    v = raw / 10       # 464 -> 46.4
                else:
                    v = float(raw)

            if 20 <= v <= 300:
                return v
        except:
            pass

    return None

def crop_display(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # blue LCD screen
    lower = np.array([70, 20, 20])
    upper = np.array([170, 255, 255])
    mask1 = cv2.inRange(hsv, lower, upper)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # white LED digit
    mask2 = cv2.inRange(gray, 150, 255)

    mask = cv2.bitwise_or(mask1, mask2)
    kernel = np.ones((7, 7), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    H, W = img.shape[:2]

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area > 300 and w > 10 and h > 10:
            boxes.append((x, y, w, h))

    if not boxes:
        return img

    x1 = min(x for x, y, w, h in boxes)
    y1 = min(y for x, y, w, h in boxes)
    x2 = max(x + w for x, y, w, h in boxes)
    y2 = max(y + h for x, y, w, h in boxes)

    pad = 50
    return img[
        max(0, y1 - pad):min(H, y2 + pad),
        max(0, x1 - pad):min(W, x2 + pad)
    ]

def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)

    attempts = []

    _, th1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    attempts.append(th1)

    _, th2 = cv2.threshold(gray, 130, 255, cv2.THRESH_BINARY)
    attempts.append(th2)

    th3 = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )
    attempts.append(th3)

    return attempts

if len(sys.argv) < 2:
    output({"error": "No image path provided"}, 1)

img = cv2.imread(sys.argv[1])

if img is None:
    output({"error": "Image not found"}, 1)

crop = crop_display(img)
processed_list = preprocess(crop)

all_attempts = []

for processed in processed_list:
    text = pytesseract.image_to_string(
        processed,
        config="--psm 6 -c tessedit_char_whitelist=0123456789."
    )

    weight = clean_weight(text)

    all_attempts.append({
        "method": "tesseract",
        "rawText": text,
        "value": weight
    })

    if weight is not None:
        output({
            "weight": f"{weight:.2f}",
            "detectedWeight": f"{weight:.2f}",
            "rawText": text,
            "allAttempts": all_attempts
        }, 0)

output({
    "error": "Weight not detected",
    "rawText": "",
    "allAttempts": all_attempts
}, 1)