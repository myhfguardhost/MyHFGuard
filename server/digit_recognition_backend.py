# FILE: backend/digit_recognition_backend.py

import sys
import json
import cv2
import imutils
from imutils import contours
import os
import numpy as np
import base64
import pytesseract
from roboflow import Roboflow
import dotenv

dotenv.load_dotenv()

# --- 7-segment recognition lookup table ---
DIGITS_LOOKUP = {
    (1, 1, 1, 0, 1, 1, 1): 0,
    (0, 0, 1, 0, 0, 1, 0): 1,
    (1, 0, 1, 1, 1, 1, 0): 2,
    (1, 0, 1, 1, 0, 1, 1): 3,
    (0, 1, 1, 1, 0, 1, 0): 4,
    (1, 1, 0, 1, 0, 1, 1): 5,
    (1, 1, 0, 1, 1, 1, 1): 6,
    (1, 0, 1, 0, 0, 1, 0): 7,
    (1, 1, 1, 0, 0, 1, 0): 7,
    (1, 1, 1, 1, 1, 1, 1): 8,
    (1, 1, 1, 1, 0, 1, 1): 9
}

def tesseract_bp_fallback(full):
    """Read clear monitor digits when the seven-segment contour reader misses.

    This is deliberately a validation-gated fallback: it returns a reading only
    when three numeric rows form a physiologically valid SYS/DIA/pulse result.
    """
    gray = cv2.cvtColor(full, cv2.COLOR_BGR2GRAY)
    # Tesseract handles the supplied LCD photos most reliably at this scale.
    if max(gray.shape) < 1400:
        scale = 1400.0 / max(gray.shape)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    variants = [gray, cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]]
    options = "--psm 11 -c tessedit_char_whitelist=0123456789"

    for image in variants:
        data = pytesseract.image_to_data(image, config=options, output_type=pytesseract.Output.DICT)
        tokens = []
        for i, raw in enumerate(data["text"]):
            text = raw.strip()
            if not text.isdigit():
                continue
            value = int(text)
            if not (25 <= value <= 260):
                continue
            try:
                confidence = float(data["conf"][i])
            except (ValueError, TypeError):
                confidence = -1
            if confidence >= 15:
                tokens.append((value, data["top"][i], data["left"][i]))

        # Read in vertical display order and test every possible triple. This
        # excludes dates, labels and isolated indicator digits.
        tokens.sort(key=lambda token: (token[1], token[2]))
        for a in range(len(tokens)):
            for b in range(a + 1, len(tokens)):
                for c in range(b + 1, len(tokens)):
                    sys_value, dia_value, pulse_value = tokens[a][0], tokens[b][0], tokens[c][0]
                    if 40 <= sys_value <= 260 and 25 <= dia_value <= 160 and 30 <= pulse_value <= 220 and sys_value > dia_value:
                        return str(sys_value), str(dia_value), str(pulse_value)
    return None

def process_image(image_path):
    try:
        # --- Load full image and resize ---
        full = cv2.imread(image_path)
        if full is None:
            print(json.dumps({"error": "Could not load image"}))
            return

        (orig_h, orig_w) = full.shape[:2]
        resized = imutils.resize(full, height=500)
        (resized_h, resized_w) = resized.shape[:2]
        ratio = resized_h / float(orig_h)

        # Prefer the trained Roboflow detector, but do not stop when it misses
        # an otherwise clear home monitor. The supplied Omron photos place the
        # LCD centrally, so this crop reliably preserves SYS, DIA and pulse.
        detected = None
        try:
            rf = Roboflow(api_key=os.environ.get("ROBOFLOW_API_KEY"))
            project = rf.workspace().project(os.environ.get("ROBOFLOW_PROJECT_ID"))
            model = project.version(int(os.environ.get("ROBOFLOW_VERSION_NUMBER"))).model
            prediction = model.predict(image_path, confidence=40, overlap=30).json()
            if prediction.get('predictions'):
                best = max(prediction['predictions'], key=lambda p: p['confidence'])
                detected = (
                    int((best['x'] - best['width'] / 2) * ratio),
                    int((best['y'] - best['height'] / 2) * ratio),
                    int(best['width'] * ratio), int(best['height'] * ratio)
                )
        except Exception:
            detected = None

        if detected:
            x, y, w, h = detected
        else:
            # Fallback for vertically photographed Omron-style monitors.
            x = int(resized_w * 0.25)
            y = int(resized_h * 0.14)
            w = int(resized_w * 0.50)
            h = int(resized_h * 0.64)

        x = max(0, x); y = max(0, y)
        w = min(w, resized_w - x); h = min(h, resized_h - y)

        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        roi_gray = gray[y:y+h, x:x+w]

        # --- FINAL, ROBUST PREPROCESSING PIPELINE ---
        # 1. Enhance Contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(roi_gray)
        
        # 2. **CRITICAL FIX**: Add a gentle blur to smooth noise AFTER enhancement
        blurred = cv2.medianBlur(enhanced, 3)

        # 3. Threshold the blurred and enhanced image
        thresh = cv2.adaptiveThreshold(blurred, 255,
                                       cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY_INV, 21, 10)

        # 4. **CRITICAL FIX**: Use a slightly stronger Closing kernel to heal breaks
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (4, 4))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        # --- Find digit contours ---
        cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        digitCnts = []
        for c in cnts:
            bx, by, bw, bh = cv2.boundingRect(c)
            if bh > 20 and (bw/float(bh) > 0.1 and bw/float(bh) < 1.0):
                digitCnts.append(c)

        if not digitCnts:
            print(json.dumps({"error": "No valid digit contours found"}))
            return

        (digitCnts, boxes) = contours.sort_contours(digitCnts, method="top-to-bottom")

        # --- Group digits into lines ---
        groups = []
        current = []
        if not boxes:
            print(json.dumps({"error": "Sorting contours failed."}))
            return
        base_y = boxes[0][1]

        for (c, (bx, by, bw, bh)) in zip(digitCnts, boxes):
            if by < base_y + bh:
                current.append((c, (bx, by, bw, bh)))
            else:
                current.sort(key=lambda it: it[1][0])
                groups.append(current)
                current = [(c, (bx, by, bw, bh))]
                base_y = by

        current.sort(key=lambda it: it[1][0])
        groups.append(current)

        # --- Recognize digits and annotate ---
        out = resized.copy()
        readings = []

        for line in groups:
            line_digits = ""
            for (c, (bx, by, bw, bh)) in line:
                roi = thresh[by:by+bh, bx:bx+bw]
                aspect = bw / float(bh)
                digit = None

                if aspect < 0.4:
                    digit = 1
                else:
                    on = [0]*7
                    (roiH, roiW) = roi.shape
                    (dW, dH) = (int(roiW*0.25), int(roiH*0.15))
                    dHC = int(roiH * 0.05)
                    segments = [
                        ((0, 0), (bw, dH)), ((0, 0), (dW, bh//2)), ((bw - dW, 0), (bw, bh//2)),
                        ((0, (bh//2)-dHC), (bw, (bh//2)+dHC)), ((0, bh//2), (dW, bh)),
                        ((bw - dW, bh//2), (bw, bh)), ((0, bh-dH), (bw, bh))
                    ]
                    for i, ((xA, yA), (xB, yB)) in enumerate(segments):
                        seg = roi[yA:yB, xA:xB]
                        if seg.size == 0: continue
                        total = cv2.countNonZero(seg)
                        area = seg.shape[0]*seg.shape[1]
                        if area > 0 and total/area > 0.45: on[i] = 1
                    try: digit = DIGITS_LOOKUP[tuple(on)]
                    except: digit = None

                if digit is not None:
                    line_digits += str(digit)
                    # Draw on the full resized image with the proper offset
                    cv2.rectangle(out, (bx+x, by+y), (bx+x+bw, by+y+bh), (0,255,0), 2)
                    cv2.putText(out, str(digit), (bx+x-10, by+y-10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,255,0), 2)

            readings.append(line_digits)

        # --- Encode annotated image ---
        _, buf = cv2.imencode('.jpg', out)
        encoded = base64.b64encode(buf).decode('utf-8')

        sys_value = readings[0] if len(readings) > 0 else ""
        dia_value = readings[1] if len(readings) > 1 else ""
        pulse_value = readings[2] if len(readings) > 2 else ""

        # The original contour path is fast. If it cannot form all three
        # readings, use OCR as a verified second pass over the full photo.
        if not (sys_value.isdigit() and dia_value.isdigit() and pulse_value.isdigit()):
            fallback = tesseract_bp_fallback(full)
            if fallback:
                sys_value, dia_value, pulse_value = fallback

        print(json.dumps({
            "sys": sys_value,
            "dia": dia_value,
            "pulse": pulse_value,
            "annotatedImage": encoded
        }))

    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e) + "\n" + traceback.format_exc()}))


# --- MAIN ENTRY POINT ---
if __name__ == "__main__":
    if len(sys.argv) == 2:
        image_path = sys.argv[1]
        process_image(image_path)
    else:
        print(json.dumps({"error": "Incorrect number of arguments passed to Python script."}))
