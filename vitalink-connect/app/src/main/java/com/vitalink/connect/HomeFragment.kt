package com.vitalink.connect

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TableLayout
import android.widget.TableRow
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class HomeFragment : Fragment() {

    private lateinit var client: HealthConnectClient
    private lateinit var viewModel: HomeViewModel
    
    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class)
    )

    private val requestPermissions = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        lifecycleScope.launch {
            val view = view ?: return@launch
            val txt = view.findViewById<TextView>(R.id.txtOutput)
            txt.text = if (granted.containsAll(permissions)) "Permissions granted" else "Permissions missing"
            val ok = granted.containsAll(permissions)
            if (ok) {
                val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                sp.edit().putBoolean("first_time_setup", false).apply()
            }
            applyPermissionsUI(ok)
        }
    }

    private suspend fun updateSyncStatus() {
        val main = getMainActivity() ?: return
        val pid = currentPatientId()
        if (pid.isEmpty()) return
        withContext(Dispatchers.IO) {
            try {
                val url = "${main.baseUrl}/patient/summary?patientId=" + java.net.URLEncoder.encode(pid, "UTF-8")
                val req = Request.Builder().url(url).get().build()
                val resp = main.http.newCall(req).execute()
                resp.use {
                    val body = it.body?.string() ?: "{}"
                    val obj = JSONObject(body)
                    val summary = obj.optJSONObject("summary") ?: JSONObject()
                    val last = summary.optString("lastSyncTs", "")
                    withContext(Dispatchers.Main) {
                        val ring = view?.findViewById<View>(R.id.syncRing)
                        val txt = view?.findViewById<TextView>(R.id.txtSyncStatus)
                        if (last.isNotEmpty()) {
                            val ts = try { java.time.Instant.parse(last) } catch (_: Exception) { null }
                            if (ts != null) {
                                val mins = java.time.Duration.between(ts, java.time.Instant.now()).abs().toMinutes()
                                txt?.text = "Last sync: ${if (mins < 60) "${mins}m ago" else "${mins/60}h ago"}"
                                val color = if (mins <= 90) resources.getColor(R.color.btnSecondary, null) else resources.getColor(R.color.bannerRequiredAccent, null)
                                ring?.background?.setTint(color)
                            } else {
                                txt?.text = "Last sync: unknown"
                                ring?.background?.setTint(resources.getColor(R.color.bannerRequiredAccent, null))
                            }
                        } else {
                            txt?.text = "Last sync: none"
                            ring?.background?.setTint(resources.getColor(R.color.btnDanger, null))
                        }
                    }
                }
            } catch (_: Exception) {}
        }
    }
    private val requestNotificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _: Boolean -> }

    private fun getMainActivity() = activity as? MainActivity

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val context = requireContext()
        val status = HealthConnectClient.getSdkStatus(context)
        val txtOutput = view.findViewById<TextView>(R.id.txtOutput)
        val cardGrant = view.findViewById<CardView>(R.id.cardGrant)
        val cardRead = view.findViewById<CardView>(R.id.cardRead)
        val cardScan = view.findViewById<CardView>(R.id.cardScan)

        if (status != HealthConnectClient.SDK_AVAILABLE) {
            txtOutput.text = "Health Connect not available"
            cardGrant.isEnabled = false
            cardRead.isEnabled = false
            return
        }

        client = HealthConnectClient.getOrCreate(context)

        val sp = context.getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        val isFirstTime = sp.getBoolean("first_time_setup", true)
        val cardFirstTime = view.findViewById<CardView>(R.id.cardFirstTime)
        val btnSetupPermissions = view.findViewById<MaterialButton>(R.id.btnSetupPermissions)

        if (isFirstTime) {
            cardFirstTime.visibility = View.VISIBLE
            btnSetupPermissions.setOnClickListener {
                lifecycleScope.launch {
                    val granted = client.permissionController.getGrantedPermissions()
                    if (!granted.containsAll(permissions)) {
                        requestPermissions.launch(permissions)
                    }
                }
            }
        } else {
            cardFirstTime.visibility = View.GONE
        }

        lifecycleScope.launch {
            val grantedInitial = client.permissionController.getGrantedPermissions()
            applyPermissionsUI(grantedInitial.containsAll(permissions))
        }

        cardGrant.setOnClickListener {
            lifecycleScope.launch {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    try {
                         val intent = Intent("androidx.health.connect.client.action.HEALTH_CONNECT_SETTINGS")
                         startActivity(intent)
                     } catch (e: Exception) {
                         try {
                             val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                             intent.data = Uri.fromParts("package", requireContext().packageName, null)
                             startActivity(intent)
                         } catch (e2: Exception) {
                             android.widget.Toast.makeText(requireContext(), "Cannot open settings", android.widget.Toast.LENGTH_SHORT).show()
                         }
                     }
                } else {
                    applyPermissionsUI(true)
                }
            }
        }

        cardRead.setOnClickListener {
            lifecycleScope.launch {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    requestPermissions.launch(permissions)
                    return@launch
                }
                ensurePatientExists()
                readMetricsAndShow()
                refreshReminderNotifications()
                lifecycleScope.launch { updateSyncStatus() }
                
                if (Build.VERSION.SDK_INT >= 33) {
                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }
        }

        cardScan.setOnClickListener {
            val main = getMainActivity()
            if (main != null) {
                try {
                    val patientId = currentPatientId()
                    // Use the scan_capture_url from strings.xml
                    val webUrl = getString(R.string.scan_capture_url)
                    val url = "$webUrl?patientId=$patientId"
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (e: Exception) {
                    android.widget.Toast.makeText(requireContext(), "Error opening link", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }

        viewModel = ViewModelProvider(this)[HomeViewModel::class.java]
        
        // Check for End of Day Chart intent
        if (requireActivity().intent?.getBooleanExtra("openEndOfDayChart", false) == true) {
            // Show Chart Logic (For now, just ensure table/chart is visible)
            // Ideally switch to a Chart Tab or expand a section
        }

        if (viewModel.dailySteps != null) {
            renderTable()
        }
        lifecycleScope.launch {
            updateSyncStatus()
        }
    }

    private fun applyPermissionsUI(granted: Boolean) {
        val view = view ?: return
        val bannerBox = view.findViewById<CardView>(R.id.bannerBox)
        val cardFirstTime = view.findViewById<CardView>(R.id.cardFirstTime)
        
        if (granted) {
            bannerBox.visibility = View.GONE
            cardFirstTime.visibility = View.GONE
        } else {
            val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
            if (!sp.getBoolean("first_time_setup", true)) {
                 bannerBox.visibility = View.VISIBLE
            }
        }
    }

    private suspend fun ensurePatientExists() {
        val main = getMainActivity() ?: return
        val pid = currentPatientId()
        if (pid.isEmpty()) return
        
        withContext(Dispatchers.IO) {
            try {
                val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                val email = sp.getString("userEmail", null)
                val dateOfBirth = sp.getString("dateOfBirth", null) ?: "1970-01-01"
                val namePart = (email ?: "").substringBefore("@")
                val firstName = namePart.replace(Regex("[^A-Za-z]"), "").ifEmpty { "User" }
                val lastName = "Patient"
                
                val jsonDob = JSONObject().apply {
                    put("patient_id", pid)
                    put("owner_id", pid)
                    put("first_name", firstName)
                    put("last_name", lastName)
                    put("dob", dateOfBirth)
                }
                
                val token = sp.getString("supabaseAccessToken", "") ?: ""
                val b = jsonDob.toString().toRequestBody("application/json".toMediaType())
                val reqBuilder = Request.Builder().url("${main.baseUrl}/admin/ensure-patient").post(b)
                if (token.isNotEmpty()) {
                    reqBuilder.header("Authorization", "Bearer $token")
                }
                val req = reqBuilder.build()
                
                main.http.newCall(req).execute()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun currentPatientId(): String {
        val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        return sp.getString("patientId", null) ?: ""
    }

    private suspend fun refreshReminderNotifications() {
        val main = getMainActivity() ?: return
        withContext(Dispatchers.IO) {
             ReminderScheduler.refresh(requireContext(), main.http, main.baseUrl, currentPatientId())
        }
    }

    private suspend fun syncTodayToServer(
        steps: Long, 
        dist: Long, 
        avgHr: Long, 
        avgSpo2: Int,
        stepRecords: List<StepsRecord>,
        distRecords: List<DistanceRecord>,
        hrRecords: List<HeartRateRecord>,
        spo2Records: List<OxygenSaturationRecord>
    ) {
        val main = getMainActivity() ?: return
        val patientId = currentPatientId()
        if (patientId.isEmpty()) return
        
        val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        val token = sp.getString("supabaseAccessToken", "") ?: ""

        withContext(Dispatchers.Main) {
            android.widget.Toast.makeText(requireContext(), "Syncing data...", android.widget.Toast.LENGTH_SHORT).show()
        }
        
        withContext(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("patient_id", patientId)
                    put("steps", steps)
                    put("distance", dist)
                    put("avg_hr", avgHr)
                    put("avg_spo2", avgSpo2)
                    put("date", java.time.LocalDate.now().toString())

                    // Add Raw Samples
                    val stepsArray = JSONArray()
                    stepRecords.forEach { r ->
                        val item = JSONObject()
                        item.put("startTime", r.startTime.toString())
                        item.put("endTime", r.endTime.toString())
                        item.put("count", r.count)
                        stepsArray.put(item)
                    }
                    put("steps_samples", stepsArray)

                    val distArray = JSONArray()
                    distRecords.forEach { r ->
                        val item = JSONObject()
                        item.put("startTime", r.startTime.toString())
                        item.put("endTime", r.endTime.toString())
                        item.put("distanceMeters", r.distance.inMeters)
                        distArray.put(item)
                    }
                    put("distance_samples", distArray)

                    val hrArray = JSONArray()
                    hrRecords.forEach { r ->
                        r.samples.forEach { s ->
                            val item = JSONObject()
                            item.put("time", s.time.toString())
                            item.put("bpm", s.beatsPerMinute)
                            hrArray.put(item)
                        }
                    }
                    put("hr_samples", hrArray)

                    val spo2Array = JSONArray()
                    spo2Records.forEach { r ->
                        val item = JSONObject()
                        item.put("time", r.time.toString())
                        item.put("percentage", r.percentage.value)
                        spo2Array.put(item)
                    }
                    put("spo2_samples", spo2Array)
                }
                
                // Assuming endpoint /patient/sync-metrics exists or similar
                val url = "${main.baseUrl}/patient/sync-metrics"
                withContext(Dispatchers.Main) {
                    android.util.Log.d("HomeFragment", "Syncing to: $url")
                }

                val body = json.toString().toRequestBody("application/json".toMediaType())
                val reqBuilder = Request.Builder().url(url).post(body)
                if (token.isNotEmpty()) {
                    reqBuilder.header("Authorization", "Bearer $token")
                }
                val req = reqBuilder.build()
                
                val resp = main.http.newCall(req).execute()
                val code = resp.code
                
                withContext(Dispatchers.Main) {
                    if (resp.isSuccessful) {
                        val countMsg = "Synced: ${stepRecords.size} steps, ${hrRecords.size} HR, ${spo2Records.size} SpO2"
                        android.widget.Toast.makeText(requireContext(), countMsg, android.widget.Toast.LENGTH_LONG).show()
                        viewModel.statusSteps = code
                                viewModel.statusDist = code
                        viewModel.statusHr = code
                        viewModel.statusSpo2 = code
                        renderTable()
                    } else {
                        android.widget.Toast.makeText(requireContext(), "Sync failed", android.widget.Toast.LENGTH_SHORT).show()
                        viewModel.statusSteps = code
                        viewModel.statusDist = code
                        viewModel.statusHr = code
                        viewModel.statusSpo2 = code
                        renderTable()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    android.widget.Toast.makeText(requireContext(), "Sync Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                    val errCode = 0
                    viewModel.statusSteps = errCode
                    viewModel.statusDist = errCode
                    viewModel.statusHr = errCode
                    viewModel.statusSpo2 = errCode
                    renderTable()
                }
                e.printStackTrace()
            }
        }
    }

    private fun renderTable() {
        val view = view ?: return
        val tbl = view.findViewById<TableLayout>(R.id.tblData)
        val txt = view.findViewById<TextView>(R.id.txtOutput)
        
        tbl.removeAllViews()
        
        val rawSteps = viewModel.rawSteps ?: return
        val rawDist = viewModel.rawDist ?: return
        val rawHr = viewModel.rawHr ?: return
        val rawSpo2 = viewModel.rawSpo2 ?: return
        
        // Render Table
        fun addCell(text: String, bold: Boolean): TextView {
            val tv = TextView(requireContext())
            tv.text = text
            tv.setPadding(12, 10, 12, 10)
            tv.gravity = Gravity.START
            if (bold) tv.setTypeface(tv.typeface, Typeface.BOLD)
            tv.layoutParams = TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            tv.setTextColor(resources.getColor(R.color.foreground, null))
            return tv
        }
        
        val header = TableRow(requireContext())
        header.addView(addCell("Time", true))
        header.addView(addCell("Steps", true))
        header.addView(addCell("Dist (m)", true))
        header.addView(addCell("HR", true))
        header.addView(addCell("SpO2", true))
        tbl.addView(header)
        
        // Aggregate by Hour
        data class HourlyAgg(
            var steps: Long = 0, 
            var dist: Double = 0.0, 
            var hrSum: Long = 0, 
            var hrCount: Int = 0, 
            var spo2Sum: Double = 0.0, 
            var spo2Count: Int = 0
        )
        
        val hourlyData = java.util.TreeMap<LocalDateTime, HourlyAgg>(compareByDescending { it })
        val zone = ZoneId.systemDefault()
        
        rawSteps.forEach { r ->
            val time = LocalDateTime.ofInstant(r.startTime, zone).truncatedTo(ChronoUnit.HOURS)
            val agg = hourlyData.getOrPut(time) { HourlyAgg() }
            agg.steps += r.count
        }
        
        rawDist.forEach { r ->
            val time = LocalDateTime.ofInstant(r.startTime, zone).truncatedTo(ChronoUnit.HOURS)
            val agg = hourlyData.getOrPut(time) { HourlyAgg() }
            agg.dist += r.distance.inMeters
        }
        
        rawHr.forEach { r ->
            r.samples.forEach { s ->
                val time = LocalDateTime.ofInstant(s.time, zone).truncatedTo(ChronoUnit.HOURS)
                val agg = hourlyData.getOrPut(time) { HourlyAgg() }
                agg.hrSum += s.beatsPerMinute
                agg.hrCount++
            }
        }
        
        rawSpo2.forEach { r ->
             val time = LocalDateTime.ofInstant(r.time, zone).truncatedTo(ChronoUnit.HOURS)
             val agg = hourlyData.getOrPut(time) { HourlyAgg() }
             agg.spo2Sum += r.percentage.value
             agg.spo2Count++
        }
        
        val dateFormatter = DateTimeFormatter.ofPattern("dd/MM HH:mm")
        val todayDate = LocalDate.now()
        
        hourlyData.forEach { (time, agg) ->
            val row = TableRow(requireContext())
            row.addView(addCell(time.format(dateFormatter), false))
            
            // Check if this row is from today (to append status code)
            val isToday = time.toLocalDate().isEqual(todayDate)
            
            // Steps
            var stepsText = agg.steps.toString()
            if (isToday && viewModel.statusSteps != null) stepsText += " (${viewModel.statusSteps})"
            row.addView(addCell(stepsText, false))
            
            // Dist
            var distText = agg.dist.toLong().toString()
            if (isToday && viewModel.statusDist != null) distText += " (${viewModel.statusDist})"
            row.addView(addCell(distText, false))
            
            // HR
            val avgHr = if (agg.hrCount > 0) agg.hrSum / agg.hrCount else 0
            var hrText = if (avgHr > 0) avgHr.toString() else "-"
            if (isToday && viewModel.statusHr != null) hrText += " (${viewModel.statusHr})"
            row.addView(addCell(hrText, false))
            
            // SpO2
            val avgSpo2 = if (agg.spo2Count > 0) (agg.spo2Sum / agg.spo2Count).toInt() else 0
            var spo2Text = if (avgSpo2 > 0) "$avgSpo2%" else "-"
            if (isToday && viewModel.statusSpo2 != null) spo2Text += " (${viewModel.statusSpo2})"
            row.addView(addCell(spo2Text, false))
            
            tbl.addView(row)
        }
        
        txt.text = "Data Loaded (Hourly)"
    }

    private suspend fun readMetricsAndShow() {
        val view = view ?: return
        val txt = view.findViewById<TextView>(R.id.txtOutput)
        val tbl = view.findViewById<TableLayout>(R.id.tblData)
        
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            txt.text = "Permissions missing"
            return
        }
        
        txt.text = "Reading..."
        tbl.removeAllViews()

        try {
            val nowInstant = Instant.now()
            val zone = ZoneId.systemDefault()
            
            val endDate = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
            val sevenDaysAgo = nowInstant.minusSeconds(7 * 24 * 60 * 60)
            
            // Fetch Data
            val steps7d = mutableListOf<StepsRecord>()
            var stepsPageToken: String? = null
            do {
                val resp = client.readRecords(
                    ReadRecordsRequest(
                        StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(sevenDaysAgo, nowInstant),
                        pageToken = stepsPageToken
                    )
                )
                steps7d.addAll(resp.records)
                stepsPageToken = resp.pageToken
            } while (stepsPageToken != null)

            val dist7d = mutableListOf<DistanceRecord>()
            var distPageToken: String? = null
            do {
                val resp = client.readRecords(
                    ReadRecordsRequest(
                        DistanceRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(sevenDaysAgo, nowInstant),
                        pageToken = distPageToken
                    )
                )
                dist7d.addAll(resp.records)
                distPageToken = resp.pageToken
            } while (distPageToken != null)
            
            val hr7d = mutableListOf<HeartRateRecord>()
            var hrPageToken: String? = null
            do {
                val resp = client.readRecords(
                    ReadRecordsRequest(
                        HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(sevenDaysAgo, nowInstant),
                        pageToken = hrPageToken
                    )
                )
                hr7d.addAll(resp.records)
                hrPageToken = resp.pageToken
            } while (hrPageToken != null)
            
            val spo27d = mutableListOf<OxygenSaturationRecord>()
            var spo2PageToken: String? = null
            do {
                val resp = client.readRecords(
                    ReadRecordsRequest(
                        OxygenSaturationRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(sevenDaysAgo, nowInstant),
                        pageToken = spo2PageToken
                    )
                )
                spo27d.addAll(resp.records)
                spo2PageToken = resp.pageToken
            } while (spo2PageToken != null)

            // Process Data
            
            val dailySteps = linkedMapOf<java.time.LocalDate, Long>()
            val dailyDist = linkedMapOf<java.time.LocalDate, Double>()
            val dailyHr = linkedMapOf<java.time.LocalDate, HrAgg>()
            val dailySpo2 = linkedMapOf<java.time.LocalDate, Spo2Agg>()
            
            for (i in 0..6) {
                val day = endDate.minusDays(i.toLong())
                dailySteps[day] = 0L
                dailyDist[day] = 0.0
                dailyHr[day] = HrAgg()
                dailySpo2[day] = Spo2Agg()
            }
            
            steps7d.forEach { r ->
                val day = LocalDateTime.ofInstant(r.endTime, zone).toLocalDate()
                if (dailySteps.containsKey(day)) {
                    dailySteps[day] = (dailySteps[day] ?: 0L) + r.count
                }
            }

            dist7d.forEach { r ->
                val day = LocalDateTime.ofInstant(r.endTime, zone).toLocalDate()
                if (dailyDist.containsKey(day)) {
                    dailyDist[day] = (dailyDist[day] ?: 0.0) + r.distance.inMeters
                }
            }
            
            hr7d.forEach { rec ->
                rec.samples.forEach { s ->
                    val day = LocalDateTime.ofInstant(s.time, zone).toLocalDate()
                    val bpm = s.beatsPerMinute.toLong()
                    dailyHr[day]?.let { agg ->
                        if (bpm < agg.min) agg.min = bpm
                        if (bpm > agg.max) agg.max = bpm
                        agg.sum += bpm
                        agg.count += 1
                    }
                }
            }
            
            spo27d.forEach { r ->
                val day = LocalDateTime.ofInstant(r.time, zone).toLocalDate()
                val pct = r.percentage.value
                dailySpo2[day]?.let { agg ->
                    if (pct < agg.min) agg.min = pct
                    if (pct > agg.max) agg.max = pct
                    agg.sum += pct
                    agg.count += 1
                }
            }
            
            // Store in ViewModel
            viewModel.dailySteps = dailySteps
            viewModel.dailyDist = dailyDist
            viewModel.dailyHr = dailyHr
            viewModel.dailySpo2 = dailySpo2
            
            viewModel.rawSteps = steps7d
            viewModel.rawDist = dist7d
            viewModel.rawHr = hr7d
            viewModel.rawSpo2 = spo27d
            
            renderTable()
            
            // Sync to server
            val todaySteps = dailySteps[endDate] ?: 0L
            val todayDist = (dailyDist[endDate] ?: 0.0).toLong()
            val hrObj = dailyHr[endDate]
            val todayHr = if (hrObj != null && hrObj.count > 0) hrObj.sum / hrObj.count else 0L
            val spo2Obj = dailySpo2[endDate]
            val todaySpo2 = if (spo2Obj != null && spo2Obj.count > 0) (spo2Obj.sum / spo2Obj.count).toInt() else 0
            
            // Log counts
            withContext(Dispatchers.Main) {
                val msg = "Found: ${steps7d.size} steps, ${dist7d.size} dist, ${hr7d.size} hr, ${spo27d.size} spo2"
                android.util.Log.d("HomeFragment", msg)
                android.widget.Toast.makeText(requireContext(), msg, android.widget.Toast.LENGTH_LONG).show()
            }

            // Send ALL fetched raw records (last 7 days)
            // We check if we have ANY data to sync (either today's summary OR any raw records)
            if (todaySteps > 0 || steps7d.isNotEmpty() || dist7d.isNotEmpty() || hr7d.isNotEmpty() || spo27d.isNotEmpty()) {
                 syncTodayToServer(todaySteps, todayDist, todayHr, todaySpo2, steps7d, dist7d, hr7d, spo27d)
            } else {
                 withContext(Dispatchers.Main) {
                     android.widget.Toast.makeText(requireContext(), "No new data to sync", android.widget.Toast.LENGTH_SHORT).show()
                 }found in Healh Cnnect (7day)LNG
            }
            
        } catch (e: Exception) {
            txt.text = "Error: ${e.message}"
            e.printStackTrace()
        }
    }
}
