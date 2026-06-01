import os
import re
import cv2
import numpy as np
import pytesseract
from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def clean_weight(text):
    text = text.replace(",", ".")
    matches = re.findall(r"\d{2,3}\.?\d?", text)

    if matches:
        try:
            return float(matches[0])
        except:
            return None

    return None


def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # enlarge image
    gray = cv2.resize(gray, None, fx=3, fy=3)

    # blur
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # threshold
    thresh = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        2,
    )

    return thresh


def try_detect_display(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # blue-green display range
    lower = np.array([60, 20, 20])
    upper = np.array([120, 255, 255])

    mask = cv2.inRange(hsv, lower, upper)

    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    if contours:
        largest = max(contours, key=cv2.contourArea)

        x, y, w, h = cv2.boundingRect(largest)

        if w > 100 and h > 50:
            crop = image[y:y+h, x:x+w]
            return crop

    return image


def extract_weight(image):
    try:
        # detect display
        cropped = try_detect_display(image)

        # preprocess
        processed = preprocess_image(cropped)

        # OCR
        text = pytesseract.image_to_string(
            processed,
            config="--psm 7 -c tessedit_char_whitelist=0123456789."
        )

        print("OCR TEXT:", text)

        weight = clean_weight(text)

        if weight:
            return weight

        # fallback original image OCR
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        text2 = pytesseract.image_to_string(
            gray,
            config="--psm 7 -c tessedit_char_whitelist=0123456789."
        )

        print("FALLBACK OCR:", text2)

        weight2 = clean_weight(text2)

        return weight2

    except Exception as e:
        print("extract_weight error:", e)
        return None


@app.route("/api/ocr/weight", methods=["POST"])
def scan_weight():
    try:
        if "image" not in request.files:
            return jsonify({
                "success": False,
                "message": "No image uploaded"
            }), 400

        file = request.files["image"]

        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        image = cv2.imread(filepath)

        if image is None:
            return jsonify({
                "success": False,
                "message": "Unable to read image"
            }), 400

        weight = extract_weight(image)

        if weight is None:
            return jsonify({
                "success": False,
                "message": "Weight not detected. Please enter manually."
            }), 400

        return jsonify({
            "success": True,
            "weight": round(weight, 1)
        })

    except Exception as e:
        print("SERVER ERROR:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)