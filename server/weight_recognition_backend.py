import sys, json, cv2, numpy as np, re

DIGITS = {
    (1,1,1,1,1,1,0): "0",
    (0,1,1,0,0,0,0): "1",
    (1,1,0,1,1,0,1): "2",
    (1,1,1,1,0,0,1): "3",
    (0,1,1,0,0,1,1): "4",
    (1,0,1,1,0,1,1): "5",
    (1,0,1,1,1,1,1): "6",
    (1,1,1,0,0,0,0): "7",
    (1,1,1,1,1,1,1): "8",
    (1,1,1,1,0,1,1): "9",
}

def output(data, code=0):
    print(json.dumps(data))
    sys.exit(code)

def find_display(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lower = np.array([85, 40, 40])
    upper = np.array([155, 255, 255])
    mask = cv2.inRange(hsv, lower, upper)

    kernel = np.ones((7,7), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.dilate(mask, kernel, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area > 800 and w > h:
            boxes.append((x, y, w, h, area))

    if not boxes:
        return None

    x, y, w, h, _ = sorted(boxes, key=lambda b: b[4], reverse=True)[0]

    pad_x = int(w * 0.08)
    pad_y = int(h * 0.25)

    H, W = img.shape[:2]
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(W, x + w + pad_x)
    y2 = min(H, y + h + pad_y)

    return img[y1:y2, x1:x2]

def prepare_digit_area(display):
    h, w = display.shape[:2]

    # keep left 72%, avoid KG and temperature
    main = display[:, :int(w * 0.72)]

    gray = cv2.cvtColor(main, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)

    # bright LED digits become white
    _, th = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)

    kernel = np.ones((3,3), np.uint8)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel)

    return th

def segment_digit(roi):
    h, w = roi.shape

    # seven segment regions: top, upper-right, lower-right, bottom, lower-left, upper-left, middle
    segs = [
        (int(w*0.20), int(h*0.00), int(w*0.80), int(h*0.18)),  # top
        (int(w*0.65), int(h*0.10), int(w*1.00), int(h*0.48)),  # upper right
        (int(w*0.65), int(h*0.52), int(w*1.00), int(h*0.90)),  # lower right
        (int(w*0.20), int(h*0.82), int(w*0.80), int(h*1.00)),  # bottom
        (int(w*0.00), int(h*0.52), int(w*0.35), int(h*0.90)),  # lower left
        (int(w*0.00), int(h*0.10), int(w*0.35), int(h*0.48)),  # upper left
        (int(w*0.20), int(h*0.40), int(w*0.80), int(h*0.62)),  # middle
    ]

    on = []
    for x1, y1, x2, y2 in segs:
        part = roi[y1:y2, x1:x2]
        total = cv2.countNonZero(part)
        area = max(1, part.shape[0] * part.shape[1])
        on.append(1 if total / area > 0.18 else 0)

    return DIGITS.get(tuple(on), "")

def recognize(display):
    th = prepare_digit_area(display)

    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)

        # Better digit filtering
        if (
            h > th.shape[0] * 0.08
            and h < th.shape[0] * 0.30
            and w > 20
            and w < th.shape[1] * 0.25
        ):
            boxes.append((x, y, w, h))

    boxes = sorted(boxes, key=lambda b: b[0])

    chars = []
    last_x = None

    for x, y, w, h in boxes:
        roi = th[y:y+h, x:x+w]

        # decimal dot
        if h < th.shape[0] * 0.25 and w < th.shape[1] * 0.08:
            chars.append(".")
            continue

        digit = segment_digit(roi)
        if digit:
            chars.append(digit)

        last_x = x

    text = "".join(chars)

    # fallback: infer decimal if 4 digits e.g. 6405 -> 64.05
    nums = re.findall(r"\d+", text)
    for n in nums:
        if len(n) == 4:
            return float(n[:2] + "." + n[2:])
        if len(n) == 3:
            return float(n[:2] + "." + n[2:])
        if len(n) == 2:
            return float(n)
        
    print("Detected boxes:", boxes)

    return None

if len(sys.argv) < 2:
    output({"error": "No image path provided"}, 1)

img = cv2.imread(sys.argv[1])
if img is None:
    output({"error": "Image not found"}, 1)

display = find_display(img)
if display is None:
    output({"error": "Weight not detected", "rawText": "display not found", "allAttempts": []}, 1)

weight = recognize(display)

if weight and 20 <= weight <= 300:
    output({
        "weight": f"{weight:.1f}",
        "detectedWeight": f"{weight:.1f}",
        "rawText": f"opencv-seven-segment:{weight}",
        "allAttempts": [{"method": "opencv-seven-segment", "value": weight}]
    }, 0)

output({
    "error": "Weight not detected",
    "rawText": "opencv seven segment failed",
    "allAttempts": [{"method": "opencv-seven-segment", "value": None}]
}, 1)