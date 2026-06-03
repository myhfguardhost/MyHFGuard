const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

module.exports = (supabase, uploadMiddleware) => async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: "File upload failed.", details: err.message })
      if (!req.file) return res.status(400).json({ error: "No image file provided." })

      const patientId = req.body.patientId
      if (!patientId) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
        return res.status(400).json({ error: "Patient ID is required." })
      }

      const imagePath = req.file.path
      const scriptPath = path.resolve(process.cwd(), "weight_recognition_backend.py")
      const pythonCommand = process.platform === "win32" ? "python" : "python3"

      const py = spawn(pythonCommand, [scriptPath, imagePath])

      let rawOutput = ""
      let errorOutput = ""

      py.stdout.on("data", data => rawOutput += data.toString())
      py.stderr.on("data", data => errorOutput += data.toString())

      py.on("close", () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)

        try {
          const jsonStart = rawOutput.indexOf("{")
          if (jsonStart === -1) {
            return res.status(400).json({
              error: "Weight not detected. Please enter manually.",
              details: errorOutput || rawOutput,
            })
          }

          const result = JSON.parse(rawOutput.substring(jsonStart))
          if (result.error || !result.weight) {
            return res.status(400).json({
              error: "Weight not detected. Please enter manually.",
              rawText: result.rawText || "",
              allAttempts: result.allAttempts || [],
            })
          }

          const weight = parseFloat(result.weight)
          return res.json({
            weight: weight.toFixed(2),
            detectedWeight: weight.toFixed(2),
            rawText: result.rawText || "",
            allAttempts: result.allAttempts || [],
          })
        } catch (e) {
          return res.status(400).json({
            error: "Weight not detected. Please enter manually.",
            details: e.message,
            rawOutput,
          })
        }
      })
    } catch (e) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      return res.status(500).json({ error: "Unexpected server error.", details: e.message })
    }
  })
}