package com.vitalink.connect

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import android.os.Build
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import android.widget.TableLayout
import android.widget.TableRow
import android.view.ViewGroup
import android.view.View
import android.graphics.Typeface
import android.view.Gravity
import java.time.format.DateTimeFormatter
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.core.app.NotificationManagerCompat
import android.content.pm.PackageManager
import android.Manifest
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth

class MainActivity : AppCompatActivity() {

    private lateinit var client: HealthConnectClient
    private lateinit var http: OkHttpClient
    private lateinit var baseUrl: String
    private lateinit var supabase: SupabaseClient
    
    private fun currentPatientId(): String {
        val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        return sp.getString("patientId", null) ?: ""
    }
    private val originId = "android_health_connect"
    private val permissions: Set<String> = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class)
    )
    private val requestPermissions = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted: Set<String> ->
        lifecycleScope.launch {
            val txt = findViewById<TextView>(R.id.txtOutput)
            txt.text = if (granted.containsAll(permissions)) "Permissions granted" else "Permissions missing"
            val ok = granted.containsAll(permissions)
            if (ok) {
                val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                sp.edit().putBoolean("first_time_setup", false).apply()
            }
            applyPermissionsUI(ok)
        }
    }

    private val requestNotificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _: Boolean -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Force light theme only - must be called before super.onCreate()
        setTheme(android.R.style.Theme_Material_Light_NoActionBar)
        super.onCreate(savedInstanceState)
        
        // Initialize Supabase
        val supabaseUrl = getString(R.string.supabase_url)
        val supabaseKey = getString(R.string.supabase_anon_key)
        supabase = createSupabaseClient(
            supabaseUrl = supabaseUrl,
            supabaseKey = supabaseKey
        ) {
            install(Auth)
        }
        
        // Check if user is logged in (check SharedPreferences first for quick check)
        val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        val patientId = sp.getString("patientId", null)
        if (patientId.isNullOrEmpty()) {
            // No patient ID, redirect to login
            startActivity(android.content.Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        setContentView(R.layout.activity_main)
        
        // Verify session in background
        lifecycleScope.launch {
            try {
                val session = supabase.auth.currentSessionOrNull()
                if (session == null) {
                    // Session expired, redirect to login
                    sp.edit().remove("patientId").remove("supabaseAccessToken").apply()
                    startActivity(android.content.Intent(this@MainActivity, LoginActivity::class.java))
                    finish()
                    return@launch
                }
                
                // Save access token if available
                val token = session.accessToken?.toString()
                if (!token.isNullOrEmpty()) {
                    sp.edit().putString("supabaseAccessToken", token).apply()
                }
            } catch (e: Exception) {
                // If session check fails, redirect to login
                sp.edit().remove("patientId").remove("supabaseAccessToken").apply()
                startActivity(android.content.Intent(this@MainActivity, LoginActivity::class.java))
                finish()
            }
        }

        // Setup top navigation
        val txtWelcomeName = findViewById<TextView>(R.id.txtWelcomeName)
        val btnSettings = findViewById<android.widget.ImageButton>(R.id.btnSettings)
        txtWelcomeName.text = getString(R.string.app_name)

        btnSettings.setOnClickListener {
            startActivity(android.content.Intent(this, SettingsActivity::class.java))
        }

        val txt = findViewById<TextView>(R.id.txtOutput)
        val cardGrant = findViewById<androidx.cardview.widget.CardView>(R.id.cardGrant)
        val cardRead = findViewById<androidx.cardview.widget.CardView>(R.id.cardRead)
        val cardScan = findViewById<androidx.cardview.widget.CardView>(R.id.cardScan)

        val status = HealthConnectClient.getSdkStatus(this)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            txt.text = getString(R.string.availability_missing)
            cardGrant.isEnabled = false
            cardRead.isEnabled = false
            return
        }

        client = HealthConnectClient.getOrCreate(this)
        
        // Check first-time user (after client is initialized)
        val isFirstTime = sp.getBoolean("first_time_setup", true)
        val cardFirstTime = findViewById<androidx.cardview.widget.CardView>(R.id.cardFirstTime)
        val btnSetupPermissions = findViewById<com.google.android.material.button.MaterialButton>(R.id.btnSetupPermissions)
        
        if (isFirstTime) {
            cardFirstTime.visibility = android.view.View.VISIBLE
            btnSetupPermissions.setOnClickListener {
                lifecycleScope.launch {
                    val granted = client.permissionController.getGrantedPermissions()
                    if (!granted.containsAll(permissions)) {
                        requestPermissions.launch(permissions)
                    }
                }
            }
        } else {
            cardFirstTime.visibility = android.view.View.GONE
        }
        val interceptor = HttpLoggingInterceptor()
        interceptor.level = HttpLoggingInterceptor.Level.BASIC
        http = OkHttpClient.Builder().addInterceptor(interceptor).build()
        baseUrl = getString(R.string.api_base_url)
        lifecycleScope.launch { ensurePatientExists() }

        fun updateUiForPermissions(grantedSet: Set<String>) {
            val ok = grantedSet.containsAll(permissions)
            applyPermissionsUI(ok)
        }

        lifecycleScope.launch {
            val grantedInitial = client.permissionController.getGrantedPermissions()
            updateUiForPermissions(grantedInitial)
        }

        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                ReminderScheduler.refresh(this@MainActivity, http, baseUrl, currentPatientId())
            } catch (_: Exception) {}
        }

        cardGrant.setOnClickListener {
            lifecycleScope.launch {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.containsAll(permissions)) {
                    requestPermissions.launch(permissions)
                } else {
                    updateOutputWithPermissionStatus()
                    updateUiForPermissions(granted)
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
                readMetricsAndShow(txt)
                updateLastHourHrLabel()
                updateTodayHrLabel()
                updateHrDiagnostics()
                syncTodayToServer()
                refreshReminderNotifications()
            }
        }

        val scanPreview = registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { _ -> }
        cardScan.setOnClickListener {
            val url = getString(R.string.scan_capture_url)
            try {
                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                startActivity(intent)
            } catch (_: Exception) {
                android.widget.Toast.makeText(this, "Scan link not available", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun ensureChannel() {
        val nm = getSystemService(NotificationManager::class.java)
        val id = "reminders"
        if (nm.getNotificationChannel(id) == null) {
            val ch = NotificationChannel(id, "Reminders", NotificationManager.IMPORTANCE_DEFAULT)
            nm.createNotificationChannel(ch)
        }
    }

    private fun hasNotifPermission(): Boolean {
        return if (android.os.Build.VERSION.SDK_INT >= 33) checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED else true
    }

    private suspend fun refreshReminderNotifications() {
        ensureChannel()
        if (!hasNotifPermission()) return
        val pid = currentPatientId()
        if (pid.isEmpty()) return
        withContext(Dispatchers.IO) {
            ReminderScheduler.refresh(this@MainActivity, http, baseUrl, pid)
        }
    }

    private suspend fun updateOutputWithPermissionStatus() {
        val granted = client.permissionController.getGrantedPermissions()
        val txt = findViewById<TextView>(R.id.txtOutput)
        txt.text = if (granted.containsAll(permissions)) "Permissions granted" else "Permissions missing"
        applyPermissionsUI(granted.containsAll(permissions))
    }

    private fun applyPermissionsUI(ok: Boolean) {
        val cardRead = findViewById<androidx.cardview.widget.CardView>(R.id.cardRead)
        val cardGrant = findViewById<androidx.cardview.widget.CardView>(R.id.cardGrant)
        val cardScan = findViewById<androidx.cardview.widget.CardView>(R.id.cardScan)
        val bannerBox = findViewById<androidx.cardview.widget.CardView>(R.id.bannerBox)
        val bannerAccent = findViewById<View>(R.id.bannerAccent)
        val txtBannerTitle = findViewById<TextView>(R.id.txtBannerTitle)
        val txtBannerDesc = findViewById<TextView>(R.id.txtBannerDesc)
        val cardFirstTime = findViewById<androidx.cardview.widget.CardView>(R.id.cardFirstTime)
        
        cardRead.isEnabled = ok
        cardRead.alpha = if (ok) 1.0f else 0.5f
        
        // Hide first-time card and grant permissions card if permissions granted
        if (ok) {
            val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
            sp.edit().putBoolean("first_time_setup", false).apply()
            cardFirstTime.visibility = android.view.View.GONE
            cardGrant.visibility = android.view.View.GONE
            // When permissions granted, make remaining cards fill the space better
            val cardsContainer = findViewById<android.widget.LinearLayout>(R.id.cardsContainer)
            cardsContainer.gravity = android.view.Gravity.CENTER
            // Adjust card margins to fill space better
            val layoutParamsRead = cardRead.layoutParams as android.widget.LinearLayout.LayoutParams
            val layoutParamsScan = cardScan.layoutParams as android.widget.LinearLayout.LayoutParams
            layoutParamsRead.weight = 0.5f
            layoutParamsScan.weight = 0.5f
            layoutParamsRead.marginStart = 16
            layoutParamsRead.marginEnd = 8
            layoutParamsScan.marginStart = 8
            layoutParamsScan.marginEnd = 16
            cardRead.layoutParams = layoutParamsRead
            cardScan.layoutParams = layoutParamsScan
        } else {
            cardGrant.visibility = android.view.View.VISIBLE
            // Reset to default layout when permissions not granted
            val layoutParamsRead = cardRead.layoutParams as android.widget.LinearLayout.LayoutParams
            val layoutParamsScan = cardScan.layoutParams as android.widget.LinearLayout.LayoutParams
            layoutParamsRead.weight = 1f
            layoutParamsScan.weight = 1f
            layoutParamsRead.marginStart = 8
            layoutParamsRead.marginEnd = 8
            layoutParamsScan.marginStart = 8
            layoutParamsScan.marginEnd = 8
            cardRead.layoutParams = layoutParamsRead
            cardScan.layoutParams = layoutParamsScan
        }
        
        if (ok) {
            bannerBox.visibility = android.view.View.VISIBLE
            bannerBox.setCardBackgroundColor(getColor(R.color.bannerGrantedBg))
            bannerAccent.setBackgroundColor(getColor(R.color.bannerGrantedAccent))
            txtBannerTitle.text = "Permissions Granted"
            txtBannerDesc.text = "You can now collect health data"
            txtBannerTitle.setTextColor(getColor(R.color.foreground))
            txtBannerDesc.setTextColor(getColor(R.color.foreground))
        } else {
            bannerBox.visibility = android.view.View.VISIBLE
            bannerBox.setCardBackgroundColor(getColor(R.color.bannerRequiredBg))
            bannerAccent.setBackgroundColor(getColor(R.color.bannerRequiredAccent))
            txtBannerTitle.text = "Permissions Required"
            txtBannerDesc.text = "Please grant Health Connect permissions"
            txtBannerTitle.setTextColor(getColor(R.color.foreground))
            txtBannerDesc.setTextColor(getColor(R.color.foreground))
        }
    }

    private suspend fun ensurePatientExists() {
        val pid = currentPatientId()
        if (pid.isEmpty()) return
        val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        val email = sp.getString("userEmail", null)
        val dateOfBirth = sp.getString("dateOfBirth", null) ?: "1970-01-01" // Always provide a default DOB
        val namePart = (email ?: "").substringBefore("@")
        val firstName = namePart.replace(Regex("[^A-Za-z]"), "").ifEmpty { "User" }
        val lastName = "Patient"
        suspend fun sendEnsure(json: String): Pair<Int, String> {
            val b = json.toRequestBody("application/json".toMediaType())
            val rb = Request.Builder().url(baseUrl + "/admin/ensure-patient").post(b)
            val r = rb.build()
            return withContext(Dispatchers.IO) {
                try {
                    http.newCall(r).execute().use { rr ->
                        val text = rr.body?.string() ?: ""
                        Pair(rr.code, text)
                    }
                } catch (e: Exception) {
                    Pair(0, e.message ?: "")
                }
            }
        }

        val jsonDob = StringBuilder("{\"patient_id\":\"").append(pid)
            .append("\",\"owner_id\":\"").append(pid)
            .append("\",\"first_name\":\"").append(firstName)
            .append("\",\"last_name\":\"").append(lastName)
            .append("\",\"dob\":\"").append(dateOfBirth).append("\"}").toString()
        val (c1, _) = sendEnsure(jsonDob)
        if (c1 !in 200..299 && c1 != 409) {
            // no-op
        }
    }

    private suspend fun readMetricsAndShow(txt: TextView) {
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            txt.text = "Permissions missing"
            return
        }
        val nowInstant = Instant.now()
        val zone = ZoneId.systemDefault()
        val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yy")
        val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
        
        val endDate = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
        val sevenDaysAgo = nowInstant.minusSeconds(7 * 24 * 60 * 60)
        val startDate = LocalDateTime.ofInstant(sevenDaysAgo, zone).toLocalDate()
        
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

        data class HrAgg(var min: Long = Long.MAX_VALUE, var max: Long = Long.MIN_VALUE, var sum: Long = 0L, var count: Int = 0)
        data class HrHour(var min: Long = Long.MAX_VALUE, var max: Long = Long.MIN_VALUE, var sum: Long = 0L, var count: Int = 0)
        data class Spo2Agg(var min: Double = Double.MAX_VALUE, var max: Double = Double.MIN_VALUE, var sum: Double = 0.0, var count: Int = 0)
        data class Spo2Hour(var min: Double = Double.MAX_VALUE, var max: Double = Double.MIN_VALUE, var sum: Double = 0.0, var count: Int = 0)
        
        val dailySteps = linkedMapOf<java.time.LocalDate, Long>()
        val dailyHr = linkedMapOf<java.time.LocalDate, HrAgg>()
        val dailySpo2 = linkedMapOf<java.time.LocalDate, Spo2Agg>()
        
        val hourlyStepsByDay: MutableMap<java.time.LocalDate, MutableMap<java.time.LocalDateTime, Long>> = linkedMapOf()
        val hourlyHrByDay: MutableMap<java.time.LocalDate, MutableMap<java.time.LocalDateTime, HrHour>> = linkedMapOf()
        val hourlySpo2ByDay: MutableMap<java.time.LocalDate, MutableMap<java.time.LocalDateTime, Spo2Hour>> = linkedMapOf()
        
        for (i in 0..6) {
            val day = endDate.minusDays(i.toLong())
            dailySteps[day] = 0L
            dailyHr[day] = HrAgg()
            dailySpo2[day] = Spo2Agg()
            hourlyStepsByDay[day] = linkedMapOf()
            hourlyHrByDay[day] = linkedMapOf()
            hourlySpo2ByDay[day] = linkedMapOf()
            
            for (h in 0..23) {
                val hour = day.atStartOfDay().plusHours(h.toLong())
                hourlyStepsByDay[day]!![hour] = 0L
                hourlyHrByDay[day]!![hour] = HrHour()
                hourlySpo2ByDay[day]!![hour] = Spo2Hour()
            }
        }
        
        steps7d.forEach { r ->
            val day = LocalDateTime.ofInstant(r.endTime, zone).toLocalDate()
            val hour = LocalDateTime.ofInstant(r.endTime, zone).truncatedTo(ChronoUnit.HOURS)
            if (dailySteps.containsKey(day)) {
                dailySteps[day] = (dailySteps[day] ?: 0L) + r.count
                hourlyStepsByDay[day]?.let { hourly ->
                    hourly[hour] = (hourly[hour] ?: 0L) + r.count
                }
            }
        }
        
        hr7d.forEach { rec ->
            rec.samples.forEach { s ->
                val day = LocalDateTime.ofInstant(s.time, zone).toLocalDate()
                val hour = LocalDateTime.ofInstant(s.time, zone).truncatedTo(ChronoUnit.HOURS)
                val bpm = s.beatsPerMinute.toLong()
                
                dailyHr[day]?.let { agg ->
                    if (bpm < agg.min) agg.min = bpm
                    if (bpm > agg.max) agg.max = bpm
                    agg.sum += bpm
                    agg.count += 1
                }
                
                hourlyHrByDay[day]?.get(hour)?.let { hourAgg ->
                    if (bpm < hourAgg.min) hourAgg.min = bpm
                    if (bpm > hourAgg.max) hourAgg.max = bpm
                    hourAgg.sum += bpm
                    hourAgg.count += 1
                }
            }
        }
        
        spo27d.forEach { r ->
            val day = LocalDateTime.ofInstant(r.time, zone).toLocalDate()
            val hour = LocalDateTime.ofInstant(r.time, zone).truncatedTo(ChronoUnit.HOURS)
            val pct = r.percentage.value
            
            dailySpo2[day]?.let { agg ->
                if (pct < agg.min) agg.min = pct
                if (pct > agg.max) agg.max = pct
                agg.sum += pct
                agg.count += 1
            }
            
            hourlySpo2ByDay[day]?.get(hour)?.let { hourAgg ->
                if (pct < hourAgg.min) hourAgg.min = pct
                if (pct > hourAgg.max) hourAgg.max = pct
                hourAgg.sum += pct
                hourAgg.count += 1
            }
        }

        val tbl = findViewById<TableLayout>(R.id.tblData)
        tbl.removeAllViews()

        fun addCell(text: String, bold: Boolean): TextView {
            val tv = TextView(this)
            tv.text = text
            tv.setPadding(12, 10, 12, 10)
            tv.gravity = Gravity.START
            if (bold) tv.setTypeface(tv.typeface, Typeface.BOLD)
            tv.layoutParams = TableRow.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            return tv
        }
        
        fun addFullWidthCell(text: String, bold: Boolean): TableRow {
            val row = TableRow(this)
            val tv = TextView(this)
            tv.text = text
            tv.setPadding(12, 10, 12, 10)
            tv.gravity = Gravity.START
            if (bold) tv.setTypeface(tv.typeface, Typeface.BOLD)
            val params = TableRow.LayoutParams(TableRow.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            params.span = 5
            tv.layoutParams = params
            row.addView(tv)
            return row
        }

        val days = dailySteps.keys.toList().sortedDescending()
        days.forEach { day ->
            val dayLabel = addFullWidthCell(day.format(dateFormatter) + " - Daily Summary", true)
            tbl.addView(dayLabel)
            
            val dayHeader = TableRow(this)
            dayHeader.addView(addCell("Metric", true))
            dayHeader.addView(addCell("Steps", true))
            dayHeader.addView(addCell("HR (Min/Max/Avg)", true))
            dayHeader.addView(addCell("SpO2 (Min/Max/Avg)", true))
            dayHeader.addView(addCell("", true))
            tbl.addView(dayHeader)
            
            val dayRow = TableRow(this)
            val steps = dailySteps[day] ?: 0L
            val hrAgg = dailyHr[day]
            val hrMin = if (hrAgg != null && hrAgg.count > 0) hrAgg.min else 0L
            val hrMax = if (hrAgg != null && hrAgg.count > 0) hrAgg.max else 0L
            val hrAvg = if (hrAgg != null && hrAgg.count > 0) (hrAgg.sum / hrAgg.count) else 0L
            val spo2Agg = dailySpo2[day]
            val spo2Min = if (spo2Agg != null && spo2Agg.count > 0) String.format("%.1f", spo2Agg.min) else "0"
            val spo2Max = if (spo2Agg != null && spo2Agg.count > 0) String.format("%.1f", spo2Agg.max) else "0"
            val spo2Avg = if (spo2Agg != null && spo2Agg.count > 0) String.format("%.1f", spo2Agg.sum / spo2Agg.count) else "0"
            
            dayRow.addView(addCell("Total", false))
            dayRow.addView(addCell(steps.toString(), false))
            dayRow.addView(addCell("$hrMin/$hrMax/$hrAvg", false))
            dayRow.addView(addCell("$spo2Min/$spo2Max/$spo2Avg", false))
            dayRow.addView(addCell("", false))
            tbl.addView(dayRow)
            
            val hourlyLabel = addFullWidthCell("  Hourly Breakdown", true)
            tbl.addView(hourlyLabel)
            
            val hourlyHeader = TableRow(this)
            hourlyHeader.addView(addCell("Hour", true))
            hourlyHeader.addView(addCell("Steps", true))
            hourlyHeader.addView(addCell("HR Min", true))
            hourlyHeader.addView(addCell("HR Max", true))
            hourlyHeader.addView(addCell("HR Avg", true))
            tbl.addView(hourlyHeader)
            
            val hours = hourlyStepsByDay[day]?.keys?.toList()?.sorted() ?: emptyList()
            hours.forEach { hour ->
                val stepsHour = hourlyStepsByDay[day]?.get(hour) ?: 0L
                val hrHour = hourlyHrByDay[day]?.get(hour)
                val hrMinH = if (hrHour != null && hrHour.count > 0) hrHour.min else 0L
                val hrMaxH = if (hrHour != null && hrHour.count > 0) hrHour.max else 0L
                val hrAvgH = if (hrHour != null && hrHour.count > 0) (hrHour.sum / hrHour.count) else 0L
                
                val hourRow = TableRow(this)
                hourRow.addView(addCell(hour.format(timeFormatter), false))
                hourRow.addView(addCell(stepsHour.toString(), false))
                hourRow.addView(addCell(hrMinH.toString(), false))
                hourRow.addView(addCell(hrMaxH.toString(), false))
                hourRow.addView(addCell(hrAvgH.toString(), false))
                tbl.addView(hourRow)
            }
            
            val spacer = addFullWidthCell("", false)
            tbl.addView(spacer)
        }

        txt.text = "Last 7 days data displayed"
    }

    private suspend fun updateLastHourHrLabel() {
        val tv = findViewById<TextView>(R.id.txtHrLastHour)
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            tv.text = getString(R.string.hr_last_hour_no_samples)
            return
        }
        val nowInstant = Instant.now()
        val start = nowInstant.minus(1, ChronoUnit.HOURS)
        val hr = mutableListOf<HeartRateRecord>()
        var hrToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start, nowInstant),
                    pageToken = hrToken
                )
            )
            hr.addAll(res.records)
            hrToken = res.pageToken
        } while (hrToken != null)
        var min = Long.MAX_VALUE
        var max = Long.MIN_VALUE
        var sum = 0L
        var count = 0
        hr.forEach { rec ->
            rec.samples.forEach { s ->
                val bpm = s.beatsPerMinute.toLong()
                if (bpm < min) min = bpm
                if (bpm > max) max = bpm
                sum += bpm
                count += 1
            }
        }
        if (count == 0) {
            tv.text = getString(R.string.hr_last_hour_no_samples)
        } else {
            val avg = (sum / count).toInt()
            tv.text = getString(R.string.hr_last_hour, min.toInt(), max.toInt(), avg)
        }
    }

    private suspend fun updateTodayHrLabel() {
        val tv = findViewById<TextView>(R.id.txtHrToday)
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            tv.text = getString(R.string.hr_today_no_samples)
            return
        }
        val nowInstant = Instant.now()
        val zone = ZoneId.systemDefault()
        val today = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
        val start = today.atStartOfDay(zone).toInstant()
        val hr = mutableListOf<HeartRateRecord>()
        var hrToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start, nowInstant),
                    pageToken = hrToken
                )
            )
            hr.addAll(res.records)
            hrToken = res.pageToken
        } while (hrToken != null)
        var min = Long.MAX_VALUE
        var max = Long.MIN_VALUE
        var sum = 0L
        var count = 0
        hr.forEach { rec ->
            rec.samples.forEach { s ->
                val bpm = s.beatsPerMinute.toLong()
                if (bpm < min) min = bpm
                if (bpm > max) max = bpm
                sum += bpm
                count += 1
            }
        }
        if (count == 0) {
            tv.text = getString(R.string.hr_today_no_samples)
        } else {
            val avg = (sum / count).toInt()
            tv.text = getString(R.string.hr_today, min.toInt(), max.toInt(), avg)
        }
    }

    private suspend fun updateHrDiagnostics() {
        val tv = findViewById<TextView>(R.id.txtHrDiag)
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            tv.text = getString(R.string.hr_diag, 0, 0, "-")
            return
        }
        val nowInstant = Instant.now()
        val zone = ZoneId.systemDefault()
        val today = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
        val startToday = today.atStartOfDay(zone).toInstant()
        val start7d = nowInstant.minusSeconds(7 * 24 * 60 * 60)
        val fmt = DateTimeFormatter.ofPattern("dd/MM HH:mm")
        val hrToday = mutableListOf<HeartRateRecord>()
        var hrTodayToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startToday, nowInstant),
                    pageToken = hrTodayToken
                )
            )
            hrToday.addAll(res.records)
            hrTodayToken = res.pageToken
        } while (hrTodayToken != null)
        val hr7d = mutableListOf<HeartRateRecord>()
        var pageToken: String? = null
        do {
            val resp = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start7d, nowInstant),
                    pageToken = pageToken
                )
            )
            hr7d.addAll(resp.records)
            pageToken = resp.pageToken
        } while (pageToken != null)
        var todayCount = 0
        var weekCount = 0
        var lastTs: LocalDateTime? = null
        hrToday.forEach { rec ->
            todayCount += rec.samples.size
            rec.samples.forEach { s ->
                val t = LocalDateTime.ofInstant(s.time, zone)
                if (lastTs == null || t.isAfter(lastTs)) lastTs = t
            }
        }
        hr7d.forEach { rec -> weekCount += rec.samples.size }
        val lastStr = if (lastTs != null) lastTs!!.format(fmt) else "-"
        
        val baseMsg = getString(R.string.hr_diag, todayCount, weekCount, lastStr)
        tv.text = baseMsg
    }

    private suspend fun syncTodayToServer() {
        val granted = client.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) return
        val txt = findViewById<TextView>(R.id.txtOutput)
        var reachable = false
        withContext(Dispatchers.IO) {
            try {
                val req = Request.Builder().url(baseUrl + "/health").get().build()
                val resp = http.newCall(req).execute()
                resp.use { reachable = (it.code == 200) }
            } catch (_: Exception) {
                reachable = false
            }
            if (!reachable) {
                val candidates = listOf(baseUrl, "http://127.0.0.1:3001", "http://10.0.2.2:3001")
                for (u in candidates.distinct()) {
                    try {
                        val r = Request.Builder().url(u + "/health").get().build()
                        val s = http.newCall(r).execute()
                        s.use { if (it.code == 200) { baseUrl = u; reachable = true } }
                    } catch (_: Exception) {}
                    if (reachable) break
                }
            }
        }
        if (!reachable) {
            val nowInstant = Instant.now()
            val zone = ZoneId.systemDefault()
            val today = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
            val startOfToday = today.atStartOfDay(zone).toInstant()
            val stepsToday = mutableListOf<StepsRecord>()
            var stepsToken: String? = null
            do {
                val res = client.readRecords(
                    ReadRecordsRequest(
                        StepsRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                        pageToken = stepsToken
                    )
                )
                stepsToday.addAll(res.records)
                stepsToken = res.pageToken
            } while (stepsToken != null)

            val distanceToday = mutableListOf<DistanceRecord>()
            var distToken: String? = null
            do {
                val res = client.readRecords(
                    ReadRecordsRequest(
                        DistanceRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                        pageToken = distToken
                    )
                )
                distanceToday.addAll(res.records)
                distToken = res.pageToken
            } while (distToken != null)

            val hrToday = mutableListOf<HeartRateRecord>()
            var hrToken: String? = null
            do {
                val res = client.readRecords(
                    ReadRecordsRequest(
                        HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                        pageToken = hrToken
                    )
                )
                hrToday.addAll(res.records)
                hrToken = res.pageToken
            } while (hrToken != null)

            val spo2Today = mutableListOf<OxygenSaturationRecord>()
            var spo2Token: String? = null
            do {
                val res = client.readRecords(
                    ReadRecordsRequest(
                        OxygenSaturationRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                        pageToken = spo2Token
                    )
                )
                spo2Today.addAll(res.records)
                spo2Token = res.pageToken
            } while (spo2Token != null)
            val deviceId = Build.MODEL ?: "device"
            val offsetMin = zone.rules.getOffset(nowInstant).totalSeconds / 60
            val patientId = currentPatientId()
            if (patientId.isEmpty()) { txt.text = "login required"; return }
            val db = LocalDb.get(this@MainActivity)
            val dao = db.dao()
            withContext(Dispatchers.IO) {
                stepsToday.forEach { r ->
                    val start = r.startTime; val end = r.endTime
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + r.count
                    dao.insertSteps(PendingSteps(uid, patientId, originId, deviceId, start.toString(), end.toString(), r.count, offsetMin))
                }
                distanceToday.forEach { r ->
                    val start = r.startTime; val end = r.endTime
                    val meters = r.distance.inMeters.toLong().toLong()
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + meters
                    dao.insertDistance(PendingDistance(uid, patientId, originId, deviceId, start.toString(), end.toString(), meters, offsetMin))
                }
                hrToday.forEach { rec ->
                    rec.samples.forEach { s ->
                        val t = s.time
                        val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + s.beatsPerMinute
                        dao.insertHr(PendingHr(uid, patientId, originId, deviceId, t.toString(), s.beatsPerMinute, offsetMin))
                    }
                }
                spo2Today.forEach { r ->
                    val t = r.time
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + r.percentage.value
                    dao.insertSpo2(PendingSpo2(uid, patientId, originId, deviceId, t.toString(), r.percentage.value, offsetMin))
                }
            }
            txt.text = "queued offline"
            return
        }
        val nowInstant = Instant.now()
        val zone = ZoneId.systemDefault()
        val today = LocalDateTime.ofInstant(nowInstant, zone).toLocalDate()
        val startOfToday = today.atStartOfDay(zone).toInstant()
        val stepsToday = mutableListOf<StepsRecord>()
        var stepsToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                    pageToken = stepsToken
                )
            )
            stepsToday.addAll(res.records)
            stepsToken = res.pageToken
        } while (stepsToken != null)

        val distanceToday = mutableListOf<DistanceRecord>()
        var distToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    DistanceRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                    pageToken = distToken
                )
            )
            distanceToday.addAll(res.records)
            distToken = res.pageToken
        } while (distToken != null)

        val hrToday = mutableListOf<HeartRateRecord>()
        var hrToken: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                    pageToken = hrToken
                )
            )
            hrToday.addAll(res.records)
            hrToken = res.pageToken
        } while (hrToken != null)

        val spo2Today = mutableListOf<OxygenSaturationRecord>()
        var spo2Token: String? = null
        do {
            val res = client.readRecords(
                ReadRecordsRequest(
                    OxygenSaturationRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startOfToday, nowInstant),
                    pageToken = spo2Token
                )
            )
            spo2Today.addAll(res.records)
            spo2Token = res.pageToken
        } while (spo2Token != null)
        val deviceId = Build.MODEL ?: "device"
        val offsetMin = zone.rules.getOffset(nowInstant).totalSeconds / 60
        val patientId = currentPatientId()
        if (patientId.isEmpty()) {
            txt.text = "login required"
            return
        }
        val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        val email = sp.getString("userEmail", null)
        val dateOfBirth = sp.getString("dateOfBirth", null) ?: "1970-01-01"
        val namePart = (email ?: "").substringBefore("@")
        val firstName = namePart.replace(Regex("[^A-Za-z]"), "").ifEmpty { "User" }
        val lastName = "Patient"
        val stepsItems = stepsToday.map { r ->
            val start = r.startTime
            val end = r.endTime
            val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + r.count
            "{" +
                "\"patientId\":\"" + patientId + "\"," +
                "\"originId\":\"" + originId + "\"," +
                "\"deviceId\":\"" + deviceId + "\"," +
                "\"startTs\":\"" + start.toString() + "\"," +
                "\"endTs\":\"" + end.toString() + "\"," +
                "\"count\":" + r.count + "," +
                "\"recordUid\":\"" + uid + "\"," +
                "\"firstName\":\"" + firstName + "\"," +
                "\"lastName\":\"" + lastName + "\"," +
                "\"dateOfBirth\":\"" + dateOfBirth + "\"," +
                "\"tzOffsetMin\":" + offsetMin +
            "}"
        }
        val distanceItems = distanceToday.map { r ->
            val start = r.startTime
            val end = r.endTime
            val meters = r.distance.inMeters.toLong()
            val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + meters
            "{" +
                "\"patientId\":\"" + patientId + "\"," +
                "\"originId\":\"" + originId + "\"," +
                "\"deviceId\":\"" + deviceId + "\"," +
                "\"startTs\":\"" + start.toString() + "\"," +
                "\"endTs\":\"" + end.toString() + "\"," +
                "\"meters\":" + meters + "," +
                "\"recordUid\":\"" + uid + "\"," +
                "\"firstName\":\"" + firstName + "\"," +
                "\"lastName\":\"" + lastName + "\"," +
                "\"dateOfBirth\":\"" + dateOfBirth + "\"," +
                "\"tzOffsetMin\":" + offsetMin +
            "}"
        }
        val hrItems = mutableListOf<String>()
        hrToday.forEach { rec ->
            rec.samples.forEach { s ->
                val t = s.time
                val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + s.beatsPerMinute
                hrItems.add(
                    "{" +
                        "\"patientId\":\"" + patientId + "\"," +
                        "\"originId\":\"" + originId + "\"," +
                        "\"deviceId\":\"" + deviceId + "\"," +
                        "\"timeTs\":\"" + t.toString() + "\"," +
                        "\"bpm\":" + s.beatsPerMinute + "," +
                        "\"recordUid\":\"" + uid + "\"," +
                        "\"firstName\":\"" + firstName + "\"," +
                        "\"lastName\":\"" + lastName + "\"," +
                        "\"dateOfBirth\":\"" + dateOfBirth + "\"," +
                        "\"tzOffsetMin\":" + offsetMin +
                    "}"
                )
            }
        }
        if (hrItems.isEmpty()) {
            val nowInstant2 = Instant.now()
            val start24h = nowInstant2.minus(24, ChronoUnit.HOURS)
            val hr24h = mutableListOf<HeartRateRecord>()
            var hr24hToken: String? = null
            do {
                val res = client.readRecords(
                    ReadRecordsRequest(
                        HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(start24h, nowInstant2),
                        pageToken = hr24hToken
                    )
                )
                hr24h.addAll(res.records)
                hr24hToken = res.pageToken
            } while (hr24hToken != null)
            hr24h.forEach { rec ->
                rec.samples.forEach { s ->
                    val t = s.time
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + s.beatsPerMinute
                    hrItems.add(
                        "{" +
                            "\"patientId\":\"" + patientId + "\"," +
                            "\"originId\":\"" + originId + "\"," +
                            "\"deviceId\":\"" + deviceId + "\"," +
                            "\"timeTs\":\"" + t.toString() + "\"," +
                            "\"bpm\":" + s.beatsPerMinute + "," +
                            "\"recordUid\":\"" + uid + "\"," +
                            "\"firstName\":\"" + firstName + "\"," +
                            "\"lastName\":\"" + lastName + "\"," +
                            "\"dateOfBirth\":\"" + dateOfBirth + "\"," +
                            "\"tzOffsetMin\":" + offsetMin +
                        "}"
                    )
                }
            }
        }
        val spo2Items = spo2Today.map { r ->
            val t = r.time
            val pct = r.percentage.value
            val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + pct
            "{" +
                "\"patientId\":\"" + patientId + "\"," +
                "\"originId\":\"" + originId + "\"," +
                "\"deviceId\":\"" + deviceId + "\"," +
                "\"timeTs\":\"" + t.toString() + "\"," +
                "\"spo2Pct\":" + pct + "," +
                "\"recordUid\":\"" + uid + "\"," +
                "\"firstName\":\"" + firstName + "\"," +
                "\"lastName\":\"" + lastName + "\"," +
                "\"dateOfBirth\":\"" + dateOfBirth + "\"," +
                "\"tzOffsetMin\":" + offsetMin +
            "}"
        }
        val stepsJson = "[" + stepsItems.joinToString(",") + "]"
        val distanceJson = "[" + distanceItems.joinToString(",") + "]"
        val spo2Json = "[" + spo2Items.joinToString(",") + "]"
        val jsonType = "application/json".toMediaType()
        val stepsBody: RequestBody = stepsJson.toRequestBody(jsonType)
        val distanceBody: RequestBody = distanceJson.toRequestBody(jsonType)
        val spo2Body: RequestBody = spo2Json.toRequestBody(jsonType)
        val stepsReq = Request.Builder().url(baseUrl + "/ingest/steps-events").post(stepsBody).build()
        val distanceReq = Request.Builder().url(baseUrl + "/ingest/distance-events").post(distanceBody).build()
        val spo2Req = Request.Builder().url(baseUrl + "/ingest/spo2-samples").post(spo2Body).build()
        // Always save to local DB first (for offline backup)
        val db = LocalDb.get(this@MainActivity)
        val dao = db.dao()
        withContext(Dispatchers.IO) {
            try {
                stepsToday.forEach { r ->
                    val start = r.startTime
                    val end = r.endTime
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + r.count
                    try {
                        dao.insertSteps(PendingSteps(uid, patientId, originId, deviceId, start.toString(), end.toString(), r.count, offsetMin))
                    } catch (_: Exception) {} // Ignore duplicate key errors
                }
                distanceToday.forEach { r ->
                    val start = r.startTime
                    val end = r.endTime
                    val meters = r.distance.inMeters.toLong()
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + start.toEpochMilli() + "|" + end.toEpochMilli() + "|" + meters
                    try {
                        dao.insertDistance(PendingDistance(uid, patientId, originId, deviceId, start.toString(), end.toString(), meters, offsetMin))
                    } catch (_: Exception) {}
                }
                hrToday.forEach { rec ->
                    rec.samples.forEach { s ->
                        val t = s.time
                        val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + s.beatsPerMinute
                        try {
                            dao.insertHr(PendingHr(uid, patientId, originId, deviceId, t.toString(), s.beatsPerMinute, offsetMin))
                        } catch (_: Exception) {}
                    }
                }
                spo2Today.forEach { r ->
                    val t = r.time
                    val uid = patientId + "|" + originId + "|" + deviceId + "|" + t.toEpochMilli() + "|" + r.percentage.value
                    try {
                        dao.insertSpo2(PendingSpo2(uid, patientId, originId, deviceId, t.toString(), r.percentage.value, offsetMin))
                    } catch (_: Exception) {}
                }
            } catch (_: Exception) {}
        }
        
        var status = ""
        withContext(Dispatchers.IO) {
            val stepsCount = stepsItems.size
            val distanceCount = distanceItems.size
            val hrCount = hrItems.size
            val spo2Count = spo2Items.size
            // hrSamplesStats removed
            var stepsSynced = false
            var distanceSynced = false
            var hrSynced = false
            var spo2Synced = false
            
            try {
                val resp = http.newCall(stepsReq).execute()
                resp.use {
                    if (it.code == 200) {
                        status = "steps=" + stepsCount + ", code=200"
                        stepsSynced = true
                        // Delete synced items from local DB
                        val uids = stepsToday.map { r ->
                            patientId + "|" + originId + "|" + deviceId + "|" + r.startTime.toEpochMilli() + "|" + r.endTime.toEpochMilli() + "|" + r.count
                        }
                        dao.deleteSteps(uids)
                    } else {
                        status = "steps=" + stepsCount + ", code=" + it.code
                    }
                }
            } catch (_: Exception) {
                status = "steps=" + stepsCount + ", error (saved locally)"
            }
            try {
                val resp = http.newCall(distanceReq).execute()
                resp.use {
                    if (it.code == 200) {
                        status = status + "; distance=" + distanceCount + ", code=200"
                        distanceSynced = true
                        val uids = distanceToday.map { r ->
                            patientId + "|" + originId + "|" + deviceId + "|" + r.startTime.toEpochMilli() + "|" + r.endTime.toEpochMilli() + "|" + r.distance.inMeters.toLong()
                        }
                        dao.deleteDistance(uids)
                    } else {
                        status = status + "; distance=" + distanceCount + ", code=" + it.code
                    }
                }
            } catch (_: Exception) {
                status = status + "; distance=" + distanceCount + ", error (saved locally)"
            }
            try {
                val batchSize = 300
                var sent = 0
                var ok = true
                while (sent < hrItems.size) {
                    val end = kotlin.math.min(sent + batchSize, hrItems.size)
                    val batch = "[" + hrItems.subList(sent, end).joinToString(",") + "]"
                    val body = batch.toRequestBody(jsonType)
                    val req = Request.Builder().url(baseUrl + "/ingest/hr-samples").post(body).build()
                    val resp = http.newCall(req).execute()
                    var batchSuccess = true
                    resp.use {
                        if (it.code != 200) {
                            val err = try { it.body?.string() ?: "" } catch (_: Exception) { "" }
                            status = status + "; hr_batch=" + (end - sent) + ", code=" + it.code + if (err.isNotEmpty()) ", msg=" + err else ""
                            batchSuccess = false
                        }
                    }
                    if (!batchSuccess) {
                        ok = false
                        break
                    }
                    sent = end
                }
                if (ok) {
                    status = status + "; hr=" + hrCount + ", code=200"
                    hrSynced = true
                    val uids = mutableListOf<String>()
                    hrToday.forEach { rec ->
                        rec.samples.forEach { s ->
                            uids.add(patientId + "|" + originId + "|" + deviceId + "|" + s.time.toEpochMilli() + "|" + s.beatsPerMinute)
                        }
                    }
                    if (uids.isNotEmpty()) {
                        dao.deleteHr(uids)
                    }
                }
            } catch (_: Exception) {
                status = status + "; hr=" + hrCount + ", error (saved locally)"
            }
            try {
                val resp = http.newCall(spo2Req).execute()
                resp.use {
                    if (it.code == 200) {
                        status = status + "; spo2=" + spo2Count + ", code=200"
                        spo2Synced = true
                        val uids = spo2Today.map { r ->
                            patientId + "|" + originId + "|" + deviceId + "|" + r.time.toEpochMilli() + "|" + r.percentage.value
                        }
                        dao.deleteSpo2(uids)
                    } else {
                        status = status + "; spo2=" + spo2Count + ", code=" + it.code
                    }
                }
            } catch (_: Exception) {
                status = status + "; spo2=" + spo2Count + ", error (saved locally)"
            }
            try {
                val db = LocalDb.get(this@MainActivity)
                val dao = db.dao()
                val jsonType = "application/json".toMediaType()
                val queuedSteps = dao.getSteps(500)
                if (queuedSteps.isNotEmpty()) {
                    val payload = queuedSteps.map { i ->
                        "{" +
                            "\"patientId\":\"" + i.patientId + "\"," +
                            "\"originId\":\"" + i.originId + "\"," +
                            "\"deviceId\":\"" + i.deviceId + "\"," +
                            "\"startTs\":\"" + i.startTs + "\"," +
                            "\"endTs\":\"" + i.endTs + "\"," +
                            "\"count\":" + i.count + "," +
                            "\"recordUid\":\"" + i.recordUid + "\"," +
                            "\"firstName\":\"" + firstName + "\"," +
                            "\"lastName\":\"" + lastName + "\"," +
                            "\"tzOffsetMin\":" + i.tzOffsetMin +
                        "}"
                    }
                    val body = ("[" + payload.joinToString(",") + "]").toRequestBody(jsonType)
                    val req = Request.Builder().url(baseUrl + "/ingest/steps-events").post(body).build()
                    val resp = http.newCall(req).execute()
                    resp.use { if (it.code == 200) dao.deleteSteps(queuedSteps.map { q -> q.recordUid }) }
                }
                val queuedDistance = dao.getDistance(500)
                if (queuedDistance.isNotEmpty()) {
                    val payload = queuedDistance.map { i ->
                        "{" +
                            "\"patientId\":\"" + i.patientId + "\"," +
                            "\"originId\":\"" + i.originId + "\"," +
                            "\"deviceId\":\"" + i.deviceId + "\"," +
                            "\"startTs\":\"" + i.startTs + "\"," +
                            "\"endTs\":\"" + i.endTs + "\"," +
                            "\"meters\":" + i.meters + "," +
                            "\"recordUid\":\"" + i.recordUid + "\"," +
                            "\"tzOffsetMin\":" + i.tzOffsetMin +
                        "}"
                    }
                    val body = ("[" + payload.joinToString(",") + "]").toRequestBody(jsonType)
                    val req = Request.Builder().url(baseUrl + "/ingest/distance-events").post(body).build()
                    val resp = http.newCall(req).execute()
                    resp.use { if (it.code == 200) dao.deleteDistance(queuedDistance.map { q -> q.recordUid }) }
                }
                val queuedHr = dao.getHr(1000)
                if (queuedHr.isNotEmpty()) {
                    val payload = queuedHr.map { i ->
                        "{" +
                            "\"patientId\":\"" + i.patientId + "\"," +
                            "\"originId\":\"" + i.originId + "\"," +
                            "\"deviceId\":\"" + i.deviceId + "\"," +
                            "\"timeTs\":\"" + i.timeTs + "\"," +
                            "\"bpm\":" + i.bpm + "," +
                            "\"recordUid\":\"" + i.recordUid + "\"," +
                            "\"firstName\":\"" + firstName + "\"," +
                            "\"lastName\":\"" + lastName + "\"," +
                            "\"tzOffsetMin\":" + i.tzOffsetMin +
                        "}"
                    }
                    val body = ("[" + payload.joinToString(",") + "]").toRequestBody(jsonType)
                    val req = Request.Builder().url(baseUrl + "/ingest/hr-samples").post(body).build()
                    val resp = http.newCall(req).execute()
                    resp.use { if (it.code == 200) dao.deleteHr(queuedHr.map { q -> q.recordUid }) }
                }
                val queuedSpo2 = dao.getSpo2(1000)
                if (queuedSpo2.isNotEmpty()) {
                    val payload = queuedSpo2.map { i ->
                        "{" +
                            "\"patientId\":\"" + i.patientId + "\"," +
                            "\"originId\":\"" + i.originId + "\"," +
                            "\"deviceId\":\"" + i.deviceId + "\"," +
                            "\"timeTs\":\"" + i.timeTs + "\"," +
                            "\"spo2Pct\":" + i.spo2Pct + "," +
                            "\"recordUid\":\"" + i.recordUid + "\"," +
                            "\"firstName\":\"" + firstName + "\"," +
                            "\"lastName\":\"" + lastName + "\"," +
                            "\"tzOffsetMin\":" + i.tzOffsetMin +
                        "}"
                    }
                    val body = ("[" + payload.joinToString(",") + "]").toRequestBody(jsonType)
                    val req = Request.Builder().url(baseUrl + "/ingest/spo2-samples").post(body).build()
                    val resp = http.newCall(req).execute()
                    resp.use { if (it.code == 200) dao.deleteSpo2(queuedSpo2.map { q -> q.recordUid }) }
                }
            } catch (_: Exception) {}
        }
        txt.text = status
    }
}