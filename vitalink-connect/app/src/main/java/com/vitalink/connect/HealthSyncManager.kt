package com.vitalink.connect

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId

object HealthSyncManager {
    suspend fun syncData(context: Context) {
        val client = HealthConnectClient.getOrCreate(context)
        try {
            val nowInstant = Instant.now()
            val sevenDaysAgo = nowInstant.minusSeconds(7 * 24 * 60 * 60)
            val steps7d = readAll(client, StepsRecord::class, sevenDaysAgo, nowInstant)
            val dist7d = readAll(client, DistanceRecord::class, sevenDaysAgo, nowInstant)
            val hr7d = readAll(client, HeartRateRecord::class, sevenDaysAgo, nowInstant)
            val spo27d = readAll(client, OxygenSaturationRecord::class, sevenDaysAgo, nowInstant)

            val zone = ZoneId.systemDefault()
            val today = java.time.LocalDate.now(zone)
            val stepsToday = steps7d.filter { java.time.LocalDateTime.ofInstant(it.startTime, zone).toLocalDate() == today }
            val distToday = dist7d.filter { java.time.LocalDateTime.ofInstant(it.startTime, zone).toLocalDate() == today }
            val hrSamplesToday = hr7d.flatMap { it.samples }.filter { java.time.LocalDateTime.ofInstant(it.time, zone).toLocalDate() == today }
            val spo2Today = spo27d.filter { java.time.LocalDateTime.ofInstant(it.time, zone).toLocalDate() == today }

            val steps = stepsToday.sumOf { it.count }
            val dist = distToday.sumOf { it.distance.inMeters }.toLong()
            val avgHr = if (hrSamplesToday.isNotEmpty()) hrSamplesToday.map { it.beatsPerMinute }.average().toLong() else 0L
            val avgSpo2 = if (spo2Today.isNotEmpty()) spo2Today.map { it.percentage.value }.average().toInt() else 0

            upload(context, steps, dist, avgHr, avgSpo2, steps7d, dist7d, hr7d, spo27d)
        } catch (_: Exception) {}
    }

    private suspend fun <T : androidx.health.connect.client.records.Record> readAll(
        client: HealthConnectClient,
        clazz: kotlin.reflect.KClass<T>,
        start: Instant,
        end: Instant
    ): List<T> {
        val out = mutableListOf<T>()
        var token: String? = null
        do {
            val resp = client.readRecords(
                ReadRecordsRequest(
                    clazz,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    pageToken = token
                )
            )
            out.addAll(resp.records)
            token = resp.pageToken
        } while (token != null)
        return out
    }

    private fun upload(
        context: Context,
        steps: Long,
        dist: Long,
        avgHr: Long,
        avgSpo2: Int,
        stepRecords: List<StepsRecord>,
        distRecords: List<DistanceRecord>,
        hrRecords: List<HeartRateRecord>,
        spo2Records: List<OxygenSaturationRecord>
    ) {
        val sp = context.getSharedPreferences("vitalink", Context.MODE_PRIVATE)
        val patientId = sp.getString("patientId", null) ?: return
        val token = sp.getString("supabaseAccessToken", "") ?: ""
        val baseUrl = context.getString(R.string.api_base_url)

        val json = JSONObject().apply {
            put("patient_id", patientId)
            put("steps", steps)
            put("distance", dist)
            put("avg_hr", avgHr)
            put("avg_spo2", avgSpo2)
            put("date", java.time.LocalDate.now().toString())

            val stepsArray = JSONArray()
            stepRecords.forEach {
                val o = JSONObject()
                o.put("startTime", it.startTime.toString())
                o.put("endTime", it.endTime.toString())
                o.put("count", it.count)
                stepsArray.put(o)
            }
            put("steps_samples", stepsArray)

            val distArray = JSONArray()
            distRecords.forEach {
                val o = JSONObject()
                o.put("startTime", it.startTime.toString())
                o.put("endTime", it.endTime.toString())
                o.put("distanceMeters", it.distance.inMeters)
                distArray.put(o)
            }
            put("distance_samples", distArray)

            val hrArray = JSONArray()
            hrRecords.forEach { rec ->
                rec.samples.forEach { s ->
                    val o = JSONObject()
                    o.put("time", s.time.toString())
                    o.put("bpm", s.beatsPerMinute)
                    hrArray.put(o)
                }
            }
            put("hr_samples", hrArray)

            val spo2Array = JSONArray()
            spo2Records.forEach {
                val o = JSONObject()
                o.put("time", it.time.toString())
                o.put("percentage", it.percentage.value)
                spo2Array.put(o)
            }
            put("spo2_samples", spo2Array)
        }

        val url = "$baseUrl/patient/sync-metrics"
        val body = json.toString().toRequestBody("application/json".toMediaType())
        val reqBuilder = Request.Builder().url(url).post(body)
        if (token.isNotEmpty()) reqBuilder.header("Authorization", "Bearer $token")
        val http = OkHttpClient()
        http.newCall(reqBuilder.build()).execute().close()
    }
}
