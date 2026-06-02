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
    H, W = img.shape[:2]
    # Strategy 1: Blue/cyan backlit display (dark scales)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    for lower, upper in [
        (np.array([85, 40, 40]),  np.array([155, 255, 255])),   # blue
        (np.array([75, 20, 20]),  np.array([165, 255, 255])),   # wider blue
    ]:
        mask = cv2.inRange(hsv, lower, upper)
        kernel = np.ones((7, 7), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.dilate(mask, kernel, iterations=2)
        box = _largest_wide_box(mask, min_area=800)
        if box:
            return _crop_with_padding(img, box)
        
    # Strategy 2: White/bright digit region on any background
    # Look for a high-brightness rectangular region
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, bright = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    kernel = np.ones((5, 5), np.uint8)
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, kernel)
    bright = cv2.dilate(bright, kernel, iterations=3)
    box = _largest_wide_box(bright, min_area=500)
    if box:
        return _crop_with_padding(img, box)
    # Strategy 3: Use bottom half only (display usually sits there)
    # and try adaptive threshold on grayscale
    bottom = img[H//2:, :]
    gray_bottom = cv2.cvtColor(bottom, cv2.COLOR_BGR2GRAY)
    adapted = cv2.adaptiveThreshold(
        gray_bottom, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )
    kernel = np.ones((5, 5), np.uint8)
    adapted = cv2.morphologyEx(adapted, cv2.MORPH_CLOSE, kernel)
    box = _largest_wide_box(adapted, min_area=400)
    if box:
        x, y, w, h, _ = box
        # offset y back to full image coordinates
        return _crop_with_padding(img, (x, y + H//2, w, h, w*h))
    return None

def _largest_wide_box(mask, min_area=800):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area > min_area and w > h:
            boxes.append((x, y, w, h, area))
    if not boxes:
        return None
    return sorted(boxes, key=lambda b: b[4], reverse=True)[0]

def _crop_with_padding(img, box):
    x, y, w, h, _ = box
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
    main = display[:, :int(w * 0.72)]
    gray = cv2.cvtColor(main, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    # Try both normal and inverted — pick whichever has more digit-like contours
    _, th_normal = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _, th_invert = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # Heuristic: digit pixels are usually < 40% of area
    ratio_n = cv2.countNonZero(th_normal) / th_normal.size
    ratio_i = cv2.countNonZero(th_invert) / th_invert.size
    # Pick the one where white pixels are the minority (the digits)
    th = th_normal if ratio_n < ratio_i else th_invert
    kernel = np.ones((3, 3), np.uint8)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel)
    return th

def segment_digit(roi):
    h, w = roi.shape

    segs = [
        (0.30, 0.02, 0.70, 0.12),  # top
        (0.68, 0.16, 0.94, 0.43),  # upper right
        (0.68, 0.57, 0.94, 0.84),  # lower right
        (0.30, 0.88, 0.70, 0.98),  # bottom
        (0.06, 0.57, 0.32, 0.84),  # lower left
        (0.06, 0.16, 0.32, 0.43),  # upper left
        (0.28, 0.44, 0.72, 0.56),  # middle
    ]

    on = []
    for x1, y1, x2, y2 in segs:
        part = roi[int(h*y1):int(h*y2), int(w*x1):int(w*x2)]
        ratio = cv2.countNonZero(part) / max(1, part.size)
        on.append(1 if ratio > 0.20 else 0)

    return DIGITS.get(tuple(on), "")

def recognize(display):
    th = prepare_digit_area(display)

    y_start = int(th.shape[0] * 0.25)
    y_end = int(th.shape[0] * 0.75)
    sub = th[y_start:y_end, :]

    contours, _ = cv2.findContours(sub, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = cv2.contourArea(c)

        if area > 2000 and h > 80 and w > 20 and x < th.shape[1] * 0.95:
            boxes.append((x, y, w, h))

    boxes = sorted(boxes, key=lambda b: b[0])

    clusters = []
    for x, y, w, h in boxes:
        cx = x + w / 2
        placed = False

        for cl in clusters:
            if abs(cx - cl["cx"]) < 120 or (x <= cl["x2"] and x + w >= cl["x1"]):
                cl["x1"] = min(cl["x1"], x)
                cl["x2"] = max(cl["x2"], x + w)
                cl["y1"] = min(cl["y1"], y)
                cl["y2"] = max(cl["y2"], y + h)
                cl["cx"] = (cl["x1"] + cl["x2"]) / 2
                placed = True
                break

        if not placed:
            clusters.append({
                "x1": x,
                "x2": x + w,
                "y1": y,
                "y2": y + h,
                "cx": cx
            })

    clusters = sorted(clusters, key=lambda c: c["x1"])[:5]

    chars = []
    for cl in clusters:
        pad = 20
        x1 = max(0, cl["x1"] - pad)
        x2 = min(sub.shape[1], cl["x2"] + pad)
        y1 = max(0, cl["y1"] - pad)
        y2 = min(sub.shape[0], cl["y2"] + pad)

        roi = sub[y1:y2, x1:x2]
        digit = segment_digit(roi)

        if digit:
            chars.append(digit)

    text = "".join(chars)

    if len(text) >= 4:
        return float(text[:2] + "." + text[2:4])
    if len(text) == 3:
        return float(text[:2] + "." + text[2:])
    if len(text) == 2:
        return float(text)

    return None

if len(sys.argv) < 2:
    output({"error": "No image path provided"}, 1)

img = cv2.imread(sys.argv[1])
if img is None:
    output({"error": "Image not found"}, 1)

display = find_display(img)

if display is None:
    output({
        "error": "Weight not detected",
        "rawText": "display not found",
        "allAttempts": []
    }, 1)

weight = recognize(display)

if weight and 20 <= weight <= 300:
    output({
        "weight": f"{weight:.2f}",
        "detectedWeight": f"{weight:.2f}",
        "rawText": f"opencv-seven-segment:{weight}",
        "allAttempts": [{"method": "opencv-seven-segment", "value": weight}]
    }, 0)

output({
    "error": "Weight not detected",
    "rawText": "opencv seven segment failed",
    "allAttempts": [{"method": "opencv-seven-segment", "value": None}]
}, 1)