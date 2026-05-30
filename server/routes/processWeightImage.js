const fs = require("fs")
const { GoogleGenerativeAI } = require("@google/generative-ai")

function extractWeight(text) {
  if (!text) return null

  const cleaned = String(text)
    .replace(/O/g, "0")
    .replace(/o/g, "0")
    .replace(/,/g, ".")
    .trim()

  const matches = cleaned.match(/\d{2,3}(?:\.\d{1,2})?/g) || []

  for (const m of matches) {
    const value = parseFloat(m)
    if (!isNaN(value) && value >= 20 && value <= 300) {
      return value
    }
  }

  return null
}

module.exports = (supabase, uploadMiddleware) => async (req, res) => {
  console.log("[processWeightImage] Gemini Vision route called")

  uploadMiddleware(req, res, async (err) => {
    let imagePath = null

    try {
      if (err) {
        return res.status(400).json({
          error: "File upload failed.",
          details: err.message,
        })
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No image file provided.",
        })
      }

      const patientId = req.body.patientId
      if (!patientId) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
        return res.status(400).json({
          error: "Patient ID is required.",
        })
      }

      const apiKey =
        process.env.GEMINI_WEIGHT_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENAI_KEY
      if (!apiKey) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
        return res.status(500).json({
          error: "Gemini API key is missing on server.",
        })
      }

      imagePath = req.file.path
      const imageBuffer = fs.readFileSync(imagePath)
      const mimeType = req.file.mimetype || "image/jpeg"

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      })

      const prompt = `
You are reading a digital weighing scale display.

Return ONLY valid JSON.
Do not include markdown.

Task:
- Detect the body weight shown on the scale.
- The weight is usually the large number beside "KG".
- Ignore temperature, battery icon, °C, ST:LB, and other small side readings.
- If the display shows 64.05 KG, return 64.05.
- If the display shows 55.30 KG, return 55.30.
- If unsure, return null.

JSON format:
{
  "weight": number|null,
  "rawText": "short explanation of what you saw"
}
`

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString("base64"),
          },
        },
      ])

      const responseText = result.response.text()
      console.log("[processWeightImage] Gemini response:", responseText)

      let parsed = null
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      } catch (e) {
        parsed = null
      }

      const detectedValue =
        parsed?.weight ??
        extractWeight(responseText)

      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }

      if (detectedValue === null || detectedValue === undefined || isNaN(Number(detectedValue))) {
        return res.status(400).json({
          error: "Weight not detected",
          rawText: responseText,
          allAttempts: [
            {
              method: "gemini-vision",
              text: responseText,
            },
          ],
        })
      }

      const weight = Number(detectedValue)

      if (weight < 20 || weight > 300) {
        return res.status(400).json({
          error: "Invalid weight value detected",
          rawText: responseText,
          detectedWeight: weight,
        })
      }

      return res.json({
        weight: weight.toFixed(1),
        detectedWeight: weight.toFixed(1),
        rawText: parsed?.rawText || responseText,
        allAttempts: [
          {
            method: "gemini-vision",
            text: responseText,
            detectedWeight: weight,
          },
        ],
      })
    } catch (e) {
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }

      console.error("[processWeightImage] Gemini scan failed:", e)

      return res.status(500).json({
        error: "Weight scan failed.",
        details: e.message,
      })
    }
  })
}