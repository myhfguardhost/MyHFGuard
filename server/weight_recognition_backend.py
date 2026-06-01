import os, re, cv2, numpy as np, pytesseract
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def parse_weight(text):
    text = text.replace(",", ".").replace("O", "0").replace("o", "0")
    nums = re.findall(r"\d{2,3}(?:\.\d{1,2})?|\d{3,4}", text)

    candidates = []
    for n in nums:
        try:
            if "." in n:
                v = float(n)
            else:
                raw = int(n)
                if 300 <= raw <= 999:
                    v = raw / 10          # 464 -> 46.4
                elif 2000 <= raw <= 30000:
                    v = raw / 100         # 4640 -> 46.40
                else:
                    v = float(raw)

            if 20 <= v <= 300:
                candidates.append(v)
        except:
            pass

    return candidates[0] if candidates else None


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


def ocr_read(img):
    best_text = ""

    for candidate in crop_display_candidates(img):
        for processed in preprocess_variants(candidate):
            for psm in [7, 8, 6, 13]:
                try:
                    text = pytesseract.image_to_string(
                        processed,
                        config=f"--psm {psm} -c tessedit_char_whitelist=0123456789."
                    )
                    print("OCR:", repr(text))
                    weight = parse_weight(text)

                    if weight:
                        return weight

                    best_text += " " + text
                except Exception as e:
                    print("Tesseract error:", e)

    print("ALL OCR TEXT:", best_text)
    return parse_weight(best_text)


@app.route("/api/ocr/weight", methods=["POST"])
def scan_weight():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image uploaded"}), 400

        file = request.files["image"]
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        img = cv2.imread(filepath)
        if img is None:
            return jsonify({"success": False, "message": "Unable to read image"}), 400

        weight = ocr_read(img)

        if weight is None:
            return jsonify({
                "success": False,
                "message": "Weight not detected. Please enter manually."
            }), 400

        return jsonify({
            "success": True,
            "weight": round(float(weight), 1)
        })

    except Exception as e:
        print("SERVER ERROR:", e)
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)