package com.vitalink.connect

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject

class MainActivity : BaseActivity() {

    lateinit var http: OkHttpClient
    lateinit var baseUrl: String
    lateinit var supabase: SupabaseClient

    override fun onCreate(savedInstanceState: Bundle?) {
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
        
        // Check Login
        val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        var patientId = sp.getString("patientId", null)
        
        // Try to recover session if patientId is missing
        if (patientId.isNullOrEmpty()) {
            kotlinx.coroutines.runBlocking {
                try {
                    val session = supabase.auth.currentSessionOrNull()
                    if (session != null && session.user != null) {
                        patientId = session.user!!.id
                        sp.edit().putString("patientId", patientId).apply()
                    }
                } catch (_: Exception) {}
            }
        }

        if (patientId.isNullOrEmpty()) {
            startActivity(Intent(this, OnboardingActivity::class.java))
            finish()
            return
        }

        // Initialize HTTP Client
        val interceptor = HttpLoggingInterceptor()
        interceptor.level = HttpLoggingInterceptor.Level.BASIC
        http = OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .connectTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
            .build()
        baseUrl = getString(R.string.api_base_url)

        setContentView(R.layout.activity_main)
        setupThemeToggle(R.id.fabThemeToggle)
        
        findViewById<android.widget.ImageButton>(R.id.btnSettings).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }
        
        // Setup Bottom Navigation
        setupBottomNavigation()
        
        // Start background tasks
        ReminderScheduler.startSchedule(this)
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                ReminderScheduler.refresh(this@MainActivity, http, baseUrl, patientId)
            } catch (_: Exception) {}
        }
        
        ensurePatientExists()

        // Verify session
        lifecycleScope.launch {
            try {
                val session = supabase.auth.currentSessionOrNull()
                if (session != null) {
                    val token = session.accessToken?.toString()
                    if (!token.isNullOrEmpty()) {
                        sp.edit().putString("supabaseAccessToken", token).apply()
                    }
                }
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun setupBottomNavigation() {
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    loadFragment(HomeFragment())
                    true
                }
                R.id.nav_appointments -> {
                    loadFragment(AppointmentsFragment())
                    true
                }
                else -> false
            }
        }
        // Load default fragment if container is empty
        if (supportFragmentManager.findFragmentById(R.id.fragment_container) == null) {
            loadFragment(HomeFragment())
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    private fun ensurePatientExists() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val sp = getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                val pid = sp.getString("patientId", null) ?: return@launch
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
                
                val b = jsonDob.toString().toRequestBody("application/json".toMediaType())
                val req = Request.Builder().url("$baseUrl/admin/ensure-patient").post(b).build()
                http.newCall(req).execute()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
