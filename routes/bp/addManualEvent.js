async function checkDuplicateReading(supabase, patientId, sys, dia, pulse, readingDate) {
  try {
    const { data, error } = await supabase
      .from("bp_readings")
      .select("*")
      .eq("patient_id", patientId)
      .eq("reading_date", readingDate)
      .limit(1)

    if (error) return false

    if (data && data.length > 0) {
      const lastReading = data[0]
      if (
        Math.abs(lastReading.systolic - sys) <= 5 &&
        Math.abs(lastReading.diastolic - dia) <= 5 &&
        Math.abs(lastReading.pulse - pulse) <= 5
      ) {
        return true
      }
    }

    return false
  } catch (err) {
    console.error("Error in duplicate check:", err)
    return false
  }
}

module.exports = (supabase) => async (req, res) => {
  const { type, value1, value2, value3, patientId, timeTs } = req.body

  if (type !== "blood_pressure") {
    return res.status(400).json({ error: "Only blood_pressure type is supported." })
  }

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID is required." })
  }

  const sys = value1 ? parseInt(value1, 10) : null
  const dia = value2 ? parseInt(value2, 10) : null
  const pulse = value3 ? parseInt(value3, 10) : null

  if (!sys || !dia || !pulse) {
    return res.status(400).json({
      error: "All three values (systolic, diastolic, pulse) are required.",
    })
  }

    const now = new Date();

    const malaysiaNow = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    }).format(now).replace(' ', 'T');

    const finalTimeTs = timeTs || malaysiaNow;

    const readingDate = finalTimeTs.split('T')[0];
    const readingTime = finalTimeTs.split('T')[1]?.slice(0, 8) || '00:00:00';

  const isDuplicate = await checkDuplicateReading(
    supabase,
    patientId,
    sys,
    dia,
    pulse,
    readingDate
  )

  if (isDuplicate) {
    return res.status(400).json({
      error: "Duplicate reading detected for the selected date.",
    })
  }

  const insertData = {
    patient_id: patientId,
    reading_date: readingDate,
    reading_time: readingTime,
    systolic: sys,
    diastolic: dia,
    pulse: pulse,
  }

  try {
    const { data, error } = await supabase
      .from("bp_readings")
      .insert([insertData])
      .select()

    if (error) throw error

    res.json({ success: true, data: data ? data[0] : null })
  } catch (error) {
    console.error("Supabase manual insert error:", error)
    res.status(500).json({
      error: "Failed to save manual event.",
      details: error.message,
    })
  }
}