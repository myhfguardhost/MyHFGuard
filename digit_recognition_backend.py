# FILE: backend/digit_recognition_backend.py

import sys
import json
import cv2
import imutils
from imutils import contours
import os
import numpy as np
import base64
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

def process_image(image_path):
    try:
        # --- Roboflow automatic detection ---
        rf = Roboflow(api_key=os.environ.get("ROBOFLOW_API_KEY"))
        project = rf.workspace().project(os.environ.get("ROBOFLOW_PROJECT_ID"))
        model = project.version(int(os.environ.get("ROBOFLOW_VERSION_NUMBER"))).model
        prediction = model.predict(image_path, confidence=20, overlap=30).json()

        full = cv2.imread(image_path)
        if full is None:
            print(json.dumps({"error": "Could not load image"}))
            return

        (orig_h, orig_w) = full.shape[:2]

        if not prediction['predictions']:
            # fallback crop: center LCD area
            orig_crop_x = int(orig_w * 0.28)
            orig_crop_y = int(orig_h * 0.25)
            orig_crop_w = int(orig_w * 0.45)
            orig_crop_h = int(orig_h * 0.48)
        else:
            best = max(prediction['predictions'], key=lambda p: p['confidence'])
            orig_crop_x = int(best['x'] - best['width'] / 2)
            orig_crop_y = int(best['y'] - best['height'] / 2)
            orig_crop_w = int(best['width'])
            orig_crop_h = int(best['height'])

        resized = imutils.resize(full, height=500)
        (resized_h, resized_w) = resized.shape[:2]
        ratio = resized_h / float(orig_h)

        # Scale the Roboflow coordinates
        x = int(orig_crop_x * ratio)
        y = int(orig_crop_y * ratio)
        w = int(orig_crop_w * ratio)
        h = int(orig_crop_h * ratio)
        
        x = max(0, x)
        y = max(0, y)
        w = min(w, resized_w - x)
        h = min(h, resized_h - y)

        if w <= 0 or h <= 0:
            print(json.dumps({"error": "Invalid screen crop area"}))
            return

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
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 2))
        thresh = cv2.dilate(thresh, kernel, iterations=1)

        # --- Find digit contours ---
        cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        digitCnts = []
        for c in cnts:
            bx, by, bw, bh = cv2.boundingRect(c)
            if bh > 20 and (bw / float(bh) > 0.08 and bw / float(bh) < 0.8):
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
            if abs(by - base_y) < 40:
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
        detections = []

        for line in groups:
            for (c, (bx, by, bw, bh)) in line:
                roi = thresh[by:by+bh, bx:bx+bw]
                aspect = bw / float(bh)
                digit = None

                # ignore very tiny noise
                if bh < 20 or bw < 3:
                    continue

                if aspect < 0.45:
                    digit = 1
                else:
                    on = [0] * 7
                    (roiH, roiW) = roi.shape
                    (dW, dH) = (int(roiW * 0.25), int(roiH * 0.15))
                    dHC = int(roiH * 0.05)

                    segments = [
                        ((0, 0), (roiW, dH)),
                        ((0, 0), (dW, roiH // 2)),
                        ((roiW - dW, 0), (roiW, roiH // 2)),
                        ((0, (roiH // 2) - dHC), (roiW, (roiH // 2) + dHC)),
                        ((0, roiH // 2), (dW, roiH)),
                        ((roiW - dW, roiH // 2), (roiW, roiH)),
                        ((0, roiH - dH), (roiW, roiH))
                    ]

                    for i, ((xA, yA), (xB, yB)) in enumerate(segments):
                        seg = roi[yA:yB, xA:xB]
                        if seg.size == 0:
                            continue

                        total = cv2.countNonZero(seg)
                        area = seg.shape[0] * seg.shape[1]

                        if area > 0 and total / area > 0.35:
                            on[i] = 1

                    digit = DIGITS_LOOKUP.get(tuple(on), None)

                if digit is not None:
                    detections.append({
                        "digit": str(digit),
                        "x": bx,
                        "y": by,
                        "w": bw,
                        "h": bh,
                        "cy": by + bh / 2
                    })

                    cv2.rectangle(out, (bx+x, by+y), (bx+x+bw, by+y+bh), (0,255,0), 2)
                    cv2.putText(out, str(digit), (bx+x-10, by+y-10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,255,0), 2)


        # --- Better row grouping ---
        detections = sorted(detections, key=lambda d: d["cy"])

        rows = []

        for d in detections:
            added = False

            for row in rows:
                row_cy = sum(item["cy"] for item in row) / len(row)

                if abs(d["cy"] - row_cy) < 35:
                    row.append(d)
                    added = True
                    break

            if not added:
                rows.append([d])


        # sort each row left-to-right and convert to number
        readings = []

        for row in rows:
            row = sorted(row, key=lambda d: d["x"])

            # remove tiny row with only 1 digit, example floating artifact "7"
            if len(row) < 2:
                continue

            value_text = "".join(d["digit"] for d in row)

            if not value_text.isdigit():
                continue

            # remove leading zero, example 089 -> 89
            value_text = str(int(value_text))
            value = int(value_text)

            # keep only realistic BP / pulse values
            if 40 <= value <= 260:
                readings.append({
                    "value": value_text,
                    "y": sum(d["cy"] for d in row) / len(row)
                })


        # keep top-to-bottom order: SYS, DIA, PULSE
        readings = sorted(readings, key=lambda r: r["y"])
        cleaned = [r["value"] for r in readings]


        # --- Encode annotated image ---
        _, buf = cv2.imencode('.jpg', out)
        encoded = base64.b64encode(buf).decode('utf-8')

        print(json.dumps({
            "sys": cleaned[0] if len(cleaned) > 0 else "",
            "dia": cleaned[1] if len(cleaned) > 1 else "",
            "pulse": cleaned[2] if len(cleaned) > 2 else "",
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
