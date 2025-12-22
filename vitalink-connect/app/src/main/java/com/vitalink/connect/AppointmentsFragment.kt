package com.vitalink.connect

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Request
import org.json.JSONArray
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class AppointmentsFragment : Fragment() {

    data class Appointment(val id: String, val title: String, val date: String, val location: String)

    private fun getMainActivity() = activity as? MainActivity

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_appointments, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fetchAppointments()
    }

    override fun onResume() {
        super.onResume()
        fetchAppointments()
    }

    private fun currentPatientId(): String {
        val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
        return sp.getString("patientId", null) ?: ""
    }

    private fun fetchAppointments() {
        val main = getMainActivity() ?: return
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val patientId = currentPatientId()
                if (patientId.isEmpty()) return@launch

                val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                val token = sp.getString("supabaseAccessToken", "") ?: ""

                val url = "${main.baseUrl}/appointments?patientId=$patientId"
                val reqBuilder = Request.Builder().url(url).get()
                if (token.isNotEmpty()) {
                    reqBuilder.header("Authorization", "Bearer $token")
                }
                val req = reqBuilder.build()
                
                val resp = main.http.newCall(req).execute()
                if (resp.isSuccessful) {
                    val body = resp.body?.string() ?: "[]"
                    val json = JSONArray(body)
                    val list = mutableListOf<Appointment>()
                    for (i in 0 until json.length()) {
                        val obj = json.getJSONObject(i)
                        list.add(
                            Appointment(
                                obj.optString("id"),
                                obj.optString("title"),
                                obj.optString("date"),
                                obj.optString("location")
                            )
                        )
                    }
                    withContext(Dispatchers.Main) {
                        renderAppointments(list)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                     android.widget.Toast.makeText(context, "Error fetching appointments: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun renderAppointments(list: List<Appointment>) {
        val container = view?.findViewById<LinearLayout>(R.id.llAppointments) ?: return
        container.removeAllViews()

        if (list.isEmpty()) {
            val tv = TextView(requireContext())
            tv.text = "No upcoming appointments"
            tv.setTextColor(resources.getColor(R.color.foreground, null))
            container.addView(tv)
            return
        }

        val inflater = LayoutInflater.from(requireContext())
        for (appt in list) {
            val view = inflater.inflate(R.layout.item_appointment, container, false)
            view.findViewById<TextView>(R.id.txtTitle).text = "${appt.title} at ${appt.location}"

            try {
                val parsed = LocalDateTime.parse(appt.date, DateTimeFormatter.ISO_DATE_TIME)
                val fmt = DateTimeFormatter.ofPattern("dd/MM hh:mm a")
                view.findViewById<TextView>(R.id.txtDate).text = parsed.format(fmt)
            } catch (e: Exception) {
                view.findViewById<TextView>(R.id.txtDate).text = appt.date
            }

            // Click to redirect to web
            view.setOnClickListener {
                val patientId = currentPatientId()
                val main = getMainActivity()
                if (main != null) {
                    // Use web_app_url from strings.xml
                    val webBase = getString(R.string.web_app_url).removeSuffix("/")
                    val url = "$webBase/schedule?patientId=$patientId"
                    
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }

            val btnDelete = view.findViewById<ImageButton>(R.id.btnDelete)
            btnDelete.setOnClickListener {
                android.app.AlertDialog.Builder(requireContext())
                    .setTitle("Delete Appointment")
                    .setMessage("Are you sure you want to delete this appointment?")
                    .setPositiveButton("Delete") { _, _ ->
                        deleteAppointment(appt.id)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }

            container.addView(view)
        }
    }

    private fun deleteAppointment(id: String) {
        val main = getMainActivity() ?: return
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val sp = requireContext().getSharedPreferences("vitalink", android.content.Context.MODE_PRIVATE)
                val token = sp.getString("supabaseAccessToken", "") ?: ""

                val url = "${main.baseUrl}/appointments/$id"
                val reqBuilder = Request.Builder().url(url).delete()
                if (token.isNotEmpty()) {
                    reqBuilder.header("Authorization", "Bearer $token")
                }
                val req = reqBuilder.build()

                val resp = main.http.newCall(req).execute()
                if (resp.isSuccessful) {
                    withContext(Dispatchers.Main) {
                        fetchAppointments()
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        android.widget.Toast.makeText(context, "Failed to delete", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                     android.widget.Toast.makeText(context, "Error fetching appointments: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
