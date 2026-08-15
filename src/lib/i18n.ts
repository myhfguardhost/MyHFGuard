import i18n from "i18next"
import { initReactI18next } from "react-i18next"


const resources = {
  en: {
    translation: {
      nav: {
        menu: "Menu",
        quickAccess: "Quick access",
        dashboard: "Dashboard",
        education: "My Learning",
        selfCheck: "My Self-Check",
        waterDiet: "My Water & Diet",
        exercise: "My Exercise",
        medication: "My Medication & Reminder",
        aiAssistant: "My Chat",
        helpSupport: "Help & Support",
        profile: "Profile",
        logout: "Logout"
      },


      common: {
        appName: "MyHFGuard",
        save: "Save",
        submit: "Submit",
        cancel: "Cancel",
        update: "Update",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        back: "Back",
        next: "Next",
        loading: "Loading...",
        noData: "No data available",
        openMenu: "Open menu",
        today: "Today",
        welcomeToMyHFGuard: "Heart failure self-care management",
        enterValue: "Enter value",
        selectDate: "Select date",
        notes: "Notes",
      },


      dashboard: {
        title: "Dashboard",
        subtitle: "Overview of your heart failure self-care progress",
        welcome: "Welcome back",
        summary: "Here is your latest health summary.",
        recentActivity: "Recent Activity",
        reminders: "Reminders",
        healthOverview: "Health Overview",
      },


      selfCheck: {
        appName: "MyHFGuard",
        title: "Self Check Toolkits",
        description: "Log your daily measurements, symptoms, and blood pressure readings",
        today: "today",
        missing: "Missing",
        completed: "Completed",


        weightTab: "Daily Weight",
        symptomsTab: "Symptoms Rating",
        vitalsTab: "Vitals Tracker",


        dailyWeightTitle: "Daily Weight (kg)",
        weightLabel: "Weight",
        weightHelp: "Use weighing scale or smart detection",
        loadingPatient: "Loading patient info...",
        enterWeight: "Enter Weight to Submit",
        saving: "Saving...",
        logWeight: "Log Weight",
        fetchingPatient: "Fetching patient details...",
        enterWeightHint: "Please enter your weight above to enable submission.",
        weightLoggedMessage: "You have already logged weight for {{date}}.",


        symptomsTitle: "Symptoms Rating",
        symptomsGuide: "Rate each symptom: 0 = No symptom, 2-3 = Mild, 4-5 = Severe",
        logSymptoms: "Log Symptoms",
        symptomsLoggedMessage: "You have already logged symptoms for {{date}}.",
        noSymptom: "No symptom",
        mild: "Mild",
        severe: "Severe",


        bloodPressure: "Blood Pressure",
        sys: "SYS",
        dia: "DIA",
        pulseShort: "PULSE",


        symptomStable: "Stable",
        symptomMonitor: "Monitor",
        symptomHighRisk: "High Risk",


        symptoms: {
          breathlessness: "More fatigued or breathless when active",
          swelling: "More swollen feet",
          sleeping: "Use more pillows or sit up when sleeping",
          cough: "Have more cough",
          abdomen: "More discomfort/swelling in the abdomen",
          currentLevel: "Current level",
        },


        weeklyTrend: {
          title: "Weekly Self-Check Trend",
          description: "Shows weekly trends for weight, blood pressure, pulse and symptom score.",
          weightTrend: "Weight Trend",
          bpPulseTrend: "Blood Pressure & Pulse Trend",
          symptomTrend: "Symptom Score Trend",
          symptomDescription: "Total score is based on the 5 symptom modules. Higher score means more severe symptoms.",
          weightKg: "Weight (kg)",
          originalDryWeight: "Original Dry Weight",
          systolic: "Systolic BP",
          diastolic: "Diastolic BP",
          pulse: "Pulse",
          symptomScore: "Symptom Score",
        },
        vitalsLoggedMessage: "Vitals already recorded for {{date}}.",
        confirmVitals: "Are you sure you want to submit these vital readings for {{date}}?",


        scanMonitor: "Scan Monitor",
        manualEntry: "Manual Entry",
        uploadImage: "Click to upload image",
        useCamera: "Use Camera",
        capturePhoto: "Capture Photo",
        processImage: "Process Image",
        uploadDifferent: "Upload Different Image",
        annotatedResult: "Annotated Result:",
        verifyEdit: "Verify & Edit Values",
        recordedAt: "Recorded",
        recordingAt: "Recording at",
        saveResult: "Save Result",
        saveReading: "Save Reading",
        systolic: "Systolic (mmHg)",
        diastolic: "Diastolic (mmHg)",
        pulse: "Pulse (bpm)",


        recentReadings: "Recent Readings",
        noReadings: "No readings recorded yet.",


        invalidWeightTitle: "Invalid Weight",
        invalidWeightDesc: "Please enter a valid weight of at least 20kg.",
        confirmWeight: "Are you sure you want to submit this weight reading for {{date}}?",
        confirmSymptoms: "Are you sure you want to submit these symptom ratings for {{date}}?",


        cancel: "Cancel",
        confirm: "Confirm",
        ok: "OK",


        pictureGuideTitle: "How to Take a Good Picture",
        pictureGuideDesc:
          "Please center the blood pressure monitor and ensure it's facing upright, not slanted. This helps our system accurately read the values.",
        correct: "Correct",
        incorrect: "Incorrect",
        correctDesc: "Monitor is straight and clearly visible",
        incorrectDesc: "Monitor is tilted or off-center",
        gotIt: "Got It / Continue",


        toast: {
          weightSaved: "Weight saved",
          weightFailed: "Failed to save weight",
          symptomsSaved: "Symptoms saved",
          symptomsFailed: "Failed to save symptoms",
          identifyUser: "Unable to identify user. Please log in again.",
          scanComplete: "Scan complete! Please verify and save the readings.",
          processImageFailed: "Failed to process image. Please try again with a clearer image.",
          bpSaved: "Blood pressure reading saved successfully!",
          vitalsFailed: "Failed to save vitals",
          cameraUnsupported: "Camera access is not supported in this browser. Please use a modern browser or upload an image instead.",
          cameraDenied: "Camera permission denied. Please allow camera access in your browser settings.",
          cameraNotFound: "No camera found on this device. Please upload an image instead.",
          cameraFailed: "Failed to access camera. Please check permissions or upload an image instead.",
          enterVitals: "Please enter systolic, diastolic and pulse.",
        },


        weightScanner: {
          title: "Weight Scanner",
          description:
            "Upload or capture a photo of the weight machine display. The detected value will fill in the weight field automatically.",
          uploadPhoto: "Upload weight machine photo",
          useCamera: "Use Camera",
          capturePhoto: "Capture Weight Photo",
          scanPhoto: "Scan Weight from Photo",
          removePhoto: "Remove Photo",
          detectedWeight: "Detected weight",
          notDetected: "Not detected",
          editDetectedWeight: "You can edit the detected value below before saving.",
          selectPhotoFirst: "Please select a weight machine photo first.",
          detectedToast: "Weight detected: {{weight}} kg",
          notDetectedToast:
            "Weight not detected clearly. Please retake the photo in a bright place and keep the display straight.",
          scanFailedToast: "Failed to scan weight image.",
          previewAlt: "Weight Preview",
          ocrResultAlt: "Weight OCR Result",
          photoGuideTitle: "How to take a clear photo",
          photoGuideDesc: "Please take a clear photo of the weighing scale display.",
          correct: "Correct photo",
          incorrect: "Incorrect photo",
          correctDesc: "Make sure the weight number is close, clear and fully visible.",
          incorrectDesc: "Avoid taking the photo too far away or blocking the display.",
          gotIt: "Got it",
        },
      },


      schedule: {
        title: "Schedule",
        subtitle: "Manage your appointments and reminders",
        appointments: "Appointments",
        reminders: "Reminders",
        medicationReminder: "Medication Reminder",
        followUpVisit: "Follow-up Visit",
        addSchedule: "Add Schedule",
        date: "Date",
        time: "Time",
        description: "Description",
        noSchedule: "No schedule available",
      },


      vitals: {
        title: "Vitals Tracker",
        subtitle: "Track your important vital signs",
        heartRate: "Heart Rate",
        bloodPressure: "Blood Pressure",
        oxygenLevel: "Oxygen Level",
        bodyTemperature: "Body Temperature",
        respiratoryRate: "Respiratory Rate",
        recordVitals: "Record Vitals",
        latestReading: "Latest Reading",
        history: "History",
      },


        education: {
          pageTitle: "Education",
          pageDescription:
            "Learn important heart failure self-care knowledge through reading materials and videos.",
          searchPlaceholder: "Search education content...",
          searchAria: "Search education content",
          moduleLabel: "Module",
          closeContent: "Close content",
          learningContent: "Learning Content",
          viewSource: "View Source",
          hideSubmodules: "Hide Topics",
          showSubmodules: "Show Topics",
          readContent: "Read Content",
          collectPointAndPlay: "Collect Point & Play Video",


          featuresTitle: "Education Features",
          featuresFooter:
            "This education section helps patients understand heart failure and improve daily self-care.",
          features: {
            guides: "Simple heart failure guides",
            structured: "Structured learning modules",
            warning: "Warning signs and self-care tips",
          },


          videoSectionTitle: "Earn Coins by Watching Education Videos",
          videoSectionDescription:
            "Watch a video for at least {{seconds}} seconds to claim {{coins}} coins. Each video can only be claimed once.",
          reward: "Reward: {{coins}} coins",
          startWatching: "Start Watching for Coins",
          watchingProgress: "Watching progress",
          continueWatching: "Continue Watching",
          addingCoins: "Adding Coins...",
          claimCoins: "Claim {{coins}} Coins",
          coinsAlreadyClaimed: "Coins already claimed",
          coinsAdded: "{{coins}} coins added successfully!",
          failedAddCoins: "Failed to add coins. Please try again.",
          seconds: "seconds",


          videos: {
            heartFailureBasic: {
              title: "Understanding Heart Failure",
              description:
                "Learn the basic meaning of heart failure, common symptoms, and why daily monitoring is important.",
            },
            lowSaltDiet: {
              title: "Low Salt Diet Guide",
              description:
                "Learn why reducing salt intake is important for heart failure patients.",
            },
            fluidManagement: {
              title: "Fluid Intake Management",
              description:
                "Learn why heart failure patients may need to control daily water and fluid intake.",
            },
          },


          modules: {
            A: {
              title: "Understanding Heart Failure",
              description:
                "Learn what heart failure means, how it happens, and common symptoms.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Basic introduction to heart failure.",
                  content:
                    "Heart failure means the heart cannot pump blood as well as the body needs. It does not mean the heart has stopped, but it means the heart needs support and careful daily monitoring.",
                },
                whatIsHF: {
                  title: "What is Heart Failure?",
                  description: "Understand the meaning of heart failure.",
                  content:
                    "Heart failure happens when the heart muscle becomes weak or stiff. This can cause tiredness, shortness of breath, swelling, and difficulty doing daily activities.",
                },
                symptoms: {
                  title: "Symptoms",
                  description: "Common symptoms of heart failure.",
                  content:
                    "Common symptoms include shortness of breath, swollen legs or ankles, sudden weight gain, tiredness, fast heartbeat, and difficulty sleeping flat.",
                },
                normalHeart: {
                  title: "How the Heart Works",
                  description: "Learn how a normal heart pumps blood.",
                  content:
                    "A healthy heart pumps blood to the lungs and the rest of the body. Blood carries oxygen and nutrients that the body needs to function.",
                },
                types: {
                  title: "Types of Heart Failure",
                  description: "Different terms used in heart failure.",
                  content:
                    "Heart failure can be described in different ways depending on how the heart pumps or fills with blood. Doctors may explain this using ejection fraction and other test results.",
                },
              },
            },


            B: {
              title: "Causes and Related Conditions",
              description:
                "Learn about heart conditions and other illnesses that may cause heart failure.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Overview of causes of heart failure.",
                  content:
                    "Heart failure may be caused by several heart-related or body-related conditions. Understanding the cause helps patients manage their health better.",
                },
                commonHeartConditions: {
                  title: "Common Heart Conditions",
                  description: "Heart problems that may lead to heart failure.",
                  content:
                    "High blood pressure, coronary artery disease, heart attack, valve disease, and abnormal heart rhythm may increase the risk of heart failure.",
                },
                otherMedicalConditions: {
                  title: "Other Medical Conditions",
                  description: "Other illnesses related to heart failure.",
                  content:
                    "Diabetes, kidney disease, obesity, lung disease, and thyroid problems can affect the heart and worsen heart failure symptoms.",
                },
              },
            },


            C: {
              title: "Self-Care and Monitoring",
              description:
                "Learn how to monitor your body and manage heart failure daily.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Why daily self-care is important.",
                  content:
                    "Daily self-care helps patients notice changes early. Patients should monitor weight, blood pressure, pulse, symptoms, water intake, salt intake, and medication use.",
                },
                bloodPressurePulse: {
                  title: "Blood Pressure and Pulse",
                  description: "How to monitor blood pressure and pulse.",
                  content:
                    "Check blood pressure and pulse regularly. Very high, very low, or unusual readings should be recorded and reported to healthcare providers.",
                },
                lifestyleChanges: {
                  title: "Lifestyle Changes",
                  description: "Healthy habits for heart failure.",
                  content:
                    "Healthy habits include reducing salt, controlling fluid intake, doing suitable exercise, stopping smoking, limiting alcohol, and following medical advice.",
                },
                managingMedicines: {
                  title: "Managing Medicines",
                  description: "Take medicine correctly.",
                  content:
                    "Take medication as prescribed by the doctor. Do not stop or change medicine without asking a healthcare provider.",
                },
                supportGroups: {
                  title: "Support Groups",
                  description: "Getting support from others.",
                  content:
                    "Support from family, friends, healthcare professionals, and patient groups can help patients manage heart failure better.",
                },
              },
            },


            D: {
              title: "Living with Heart Failure",
              description:
                "Practical tips for daily life, travel, vaccines, and work.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Living safely with heart failure.",
                  content:
                    "Patients with heart failure can still live a meaningful life by planning daily activities, following treatment, and recognizing warning signs early.",
                },
                travel: {
                  title: "Travel",
                  description: "Travel tips for heart failure patients.",
                  content:
                    "Before travelling, prepare enough medicine, check medical documents, avoid overexertion, and discuss with a doctor if symptoms are unstable.",
                },
                vaccines: {
                  title: "Vaccinations",
                  description: "Why vaccines may be important.",
                  content:
                    "Vaccinations may reduce the risk of infections that can worsen heart failure. Patients should ask their doctor which vaccines are suitable.",
                },
                workAdjustments: {
                  title: "Work Adjustments",
                  description: "Managing work and daily responsibilities.",
                  content:
                    "Some patients may need rest periods, lighter duties, or flexible schedules depending on their symptoms and doctor’s advice.",
                },
                emotions: {
                  title: "Your Emotions",
                  description: "Managing feelings and emotional changes.",
                  content:
                    "Living with heart failure may cause stress, worry, sadness, or fear. Talking to family, friends, support groups, or healthcare professionals can help.",
                },
              },
            },


            E: {
              title: "For Caregivers",
              description:
                "Information for family members and caregivers who support heart failure patients.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Understanding the caregiver role.",
                  content:
                    "Caregivers play an important role in supporting heart failure patients with medication, appointments, daily monitoring, and emotional support.",
                },
                howToHelp: {
                  title: "How to Help",
                  description: "Ways caregivers can support patients.",
                  content:
                    "Caregivers can help by reminding patients to take medication, monitor symptoms, attend appointments, follow diet advice, and seek medical help when warning signs appear.",
                },
                caringStress: {
                  title: "Caring Can Be Hard",
                  description: "Managing caregiver stress.",
                  content:
                    "Caring for someone can be tiring and stressful. Caregivers should also rest, ask for help, and look after their own health.",
                },
                financialConcerns: {
                  title: "Financial Concerns",
                  description: "Managing cost-related worries.",
                  content:
                    "Medical costs, travel, medication, and care needs may create financial pressure. Families can discuss available support with healthcare workers or community services.",
                },
                supportServices: {
                  title: "Support Services",
                  description: "Finding useful support.",
                  content:
                    "Support services may include healthcare teams, patient groups, counselling, social workers, and community organisations.",
                },
              },
            },


            H: {
              title: "Warning Signs",
              description:
                "Learn warning signs that may need medical attention.",
              submodules: {
                introduction: {
                  title: "Introduction",
                  description: "Recognising warning signs early.",
                  content:
                    "Heart failure symptoms can worsen quickly. Patients should know the warning signs and seek medical advice when symptoms become serious.",
                },
                shortnessOfBreath: {
                  title: "Shortness of Breath",
                  description: "Breathing difficulty as a warning sign.",
                  content:
                    "Shortness of breath during rest, while lying down, or suddenly at night may be a warning sign that heart failure is worsening.",
                },
                chestPain: {
                  title: "Chest Pain",
                  description: "Chest pain should not be ignored.",
                  content:
                    "Chest pain, tightness, or pressure may be serious. Patients should seek urgent medical help if chest pain occurs.",
                },
                rapidWeightGain: {
                  title: "Rapid Weight Gain",
                  description: "Sudden weight gain may mean fluid retention.",
                  content:
                    "A sudden increase in weight may show that the body is retaining fluid. Patients should record weight daily and report unusual changes.",
                },
                swellingLegs: {
                  title: "Swelling in Legs or Ankles",
                  description: "Swelling may show fluid build-up.",
                  content:
                    "Swelling in the legs, ankles, feet, or abdomen may be caused by fluid build-up and should be monitored carefully.",
                },
              },
            },
          },
        },
       


      helpSupport: {
        title: "Help & Support",
        subtitle: "Get support, emergency guidance and help for using MyHFGuard.",


        aboutTitle: "About MyHFGuard",
        aboutBody: "MyHFGuard helps heart failure patients monitor symptoms, manage reminders, record daily health data and learn self-care more easily.",


        contactUs: "Contact Us",
        needHelp: "Choose the most suitable support option below.",


        emergencyContact: "Emergency Contact",
        emergencyBody: "If you have severe shortness of breath, chest pain, fainting or any urgent medical condition, please contact emergency services immediately. Do not rely on this app for urgent treatment.",


        supportTitle: "Email Support",
        supportBody: "For technical issues or general system support, contact the MyHFGuard support team by email.",


        whatsappTitle: "WhatsApp Support",
        whatsappBody: "For quick communication, you may also contact support through WhatsApp.",


        callButton: "Call Emergency (999)",
        emailButton: "Email Support",
        whatsappButton: "Open WhatsApp",


        disclaimer: "This app is for self-management support only and does not replace professional medical advice, diagnosis or treatment."
      },


      medication: {
        title: "Medication",
        subtitle: "Manage your medication schedule",
        medicineName: "Medicine Name",
        dosage: "Dosage",
        frequency: "Frequency",
        reminderTime: "Reminder Time",
        addMedication: "Add Medication",
        
        time: {
          noonShort: "12:00 PM",
          nightShort: "10:00 PM",
        },
      },


      aiAssistant: {
        title: "AI Assistant",
        subtitle: "Ask questions about your symptoms and heart failure care",
        placeholder: "Type your message here...",
        send: "Send",

        patientSummary: "Patient Summary",
        patientSummaryDesc: "Basic data used to support AI responses",
        basicInfo: "Basic Info",
        latestHealthStatus: "Latest Health Status",
        medicationReminder: "Medication Reminder",
        name: "Name",
        age: "Age",
        baselineDryWeight: "Baseline Dry Weight",
        latestWeight: "Latest Weight",
        weightChange: "Weight Change",
        latestBP: "Latest BP",
      },


      waterDiet: {
        title: "My Water and Low Salt Diet",
        description: "Track daily fluid intake and follow a heart-healthy diet.",
        subtitle: "Please submit daily or at least 3 times per week.",
        today: "today",
        buttons: {
          saving: "Saving...",
          save: "Save Entry for {{date}}",
        },


        toast: {
          unableSession: "Unable to load session",
          loginFirst: "Please log in first",
          fillWater: "Please enter water restriction and choose cups",
          saved: "Water and low salt diet saved successfully",
          failed: "Failed to save record",
        },


        weekly: {
          title: "Weekly Tracking Status",
          entries: "Entries this week",
          target: "Target",
          targetValue: "3 times",
          status: "Status",
          onTrack: "On Track",
          needMore: "Need More Entries",
        },


        waterCard: {
          title: "My Water Intake",
          limitLabel: "Doctor Water Restriction (ml)",
          placeholder: "Example: 800",
          selectLabel: "Select Today Water Intake (8 cups)",
          selectedIntake: "Selected Intake",
          limitText: "Limit",
        },


        waterStatus: {
          green: "Within Range",
          orange: "Slightly Above Range",
          red: "Exceeded Restriction",
        },


        saltCard: {
          title: "My Low Salt Diet",
          dailyScore: "Daily Salt Score",
        },


        saltOptions: {
          natural: "Natural / Low Salt",
          moderate: "Moderate Salt",
          high: "High Salt",
        },


        saltStatus: {
          green: "Low Salt",
          orange: "Moderate Salt",
          red: "High Salt",
        },


        meals: {
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
        },


        summary: {
          title: "Latest Summary",
          waterRestriction: "Water Restriction",
          todayWater: "Today Water Intake",
          waterStatus: "Water Status",
          saltStatus: "Salt Status",
        },


        charts: {
          waterGraph: "Water Intake Graph",
          saltGraph: "Low Salt Diet Graph",
          waterLine: "Water Intake (ml)",
          limitLine: "Restriction (ml)",
          saltBar: "Salt Score",
        },


        error: {
          loadTitle: "Failed to load water and salt data.",
          loadDesc: "Please make sure the table water_salt_logs exists in Supabase and RLS policies are added.",
        },
      },

      profile: {
        myProfile: "My Profile",
        profileDesc: "Manage your personal, health and app preference information.",
        baselineLocked: "Baseline Locked",
        baselineNotice:
          "Your baseline health data has been locked. You can still update your medication and language preference.",
        personalInformation: "Personal Information",
        fullName: "Full Name",
        enterFullName: "Enter full name",
        age: "Age",
        enterAge: "Enter age",
        icNumber: "IC Number",
        enterIcNumber: "Enter IC number",
        preferences: "Preferences",
        language: "Language",
        useTopLanguageButton: "use the top language button to switch the whole app.",
        baselineHealthData: "Baseline Health Data",
        bloodPressureSystolic: "Blood Pressure Systolic",
        bloodPressureDiastolic: "Blood Pressure Diastolic",
        heartRate: "Heart Rate",
        dryWeight: "Dry Weight",
        height: "Height",
        bmi: "BMI",
        currentMedication: "Current Medication",
        enterCurrentMedication: "Enter current medication: Aspirin(noon), Atorvastatin(night)",
        saveProfile: "Save Profile",
        saving: "Saving...",
        loadingProfile: "Loading profile...",
        autoCalculated: "Auto calculated",
        systolicPlaceholder: "e.g. 120",
        diastolicPlaceholder: "e.g. 80",
        heartRatePlaceholder: "e.g. 72",
        dryWeightPlaceholder: "e.g. 60",
        heightPlaceholder: "e.g. 160",
        userSessionNotFound: "User session not found. Please log in again.",
        failedToSaveProfile: "Failed to save profile.",
        profileSavedSuccessfully: "Profile saved successfully!",
        somethingWentWrongSaving: "Something went wrong while saving profile.",
      },


      coin: {
        coinCollection: "Coin Collection",
        coinsEarnedFromEducationVideos: "Coins earned from education videos",
        refreshCoins: "Refresh Coins",
        refreshing: "Refreshing...",
        failedToRefreshCoins: "Failed to refresh coins.",
      },
    },
  },


  ms: {
    translation: {
      nav: {
        menu: "Menu",
        dashboard: "Papan Pemuka",
        education: "Pembelajaran Saya",
        selfCheck: "Semakan Kendiri Saya",
        waterDiet: "Air & Diet Saya",
        exercise: "Senaman Saya",
        medication: "Ubat & Peringatan Saya",
        aiAssistant: "Sembang Saya",
        helpSupport: "Bantuan & Sokongan",
        profile: "Profil",
        quickAccess: "Akses pantas",
        logout: "Log Keluar"
      },


      common: {
        appName: "MyHFGuard",
        save: "Simpan",
        submit: "Hantar",
        cancel: "Batal",
        update: "Kemas Kini",
        delete: "Padam",
        edit: "Edit",
        close: "Tutup",
        back: "Kembali",
        next: "Seterusnya",
        loading: "Sedang dimuatkan...",
        noData: "Tiada data tersedia",
        openMenu: "Buka menu",
        today: "Hari ini",
        welcomeToMyHFGuard: "Pengurusan penjagaan kendiri kegagalan jantung",
        enterValue: "Masukkan nilai",
        selectDate: "Pilih tarikh",
        notes: "Catatan",
      },


      dashboard: {
        title: "Papan Pemuka",
        subtitle: "Gambaran keseluruhan kemajuan penjagaan kendiri kegagalan jantung anda",
        welcome: "Selamat kembali",
        summary: "Berikut ialah ringkasan kesihatan terkini anda.",
        recentActivity: "Aktiviti Terkini",
        reminders: "Peringatan",
        healthOverview: "Gambaran Kesihatan",
      },


      selfCheck: {
        appName: "MyHFGuard",
        title: "Alat Pemeriksaan Kendiri",
        description: "Catat ukuran harian, simptom, dan bacaan tekanan darah anda",
        today: "hari ini",
        missing: "Belum lengkap",
        completed: "Selesai",


        weightTab: "Berat Harian",
        symptomsTab: "Penilaian Simptom",
        vitalsTab: "Penjejak Vital",


        dailyWeightTitle: "Berat Harian (kg)",
        weightLabel: "Berat",
        weightHelp: "Gunakan penimbang atau pengesanan pintar",
        loadingPatient: "Memuat maklumat pesakit...",
        enterWeight: "Masukkan Berat untuk Hantar",
        saving: "Menyimpan...",
        logWeight: "Catat Berat",
        fetchingPatient: "Mengambil maklumat pesakit...",
        enterWeightHint: "Sila masukkan berat anda di atas untuk membolehkan penghantaran.",
        weightLoggedMessage: "Anda telah mencatat berat untuk {{date}}.",


        symptomsTitle: "Penilaian Simptom",
        symptomsGuide: "Nilai setiap simptom: 0 = Tiada simptom, 1 = Ringan, 5 = Teruk",
        logSymptoms: "Catat Simptom",
        symptomsLoggedMessage: "Anda telah mencatat simptom untuk {{date}}.",
        noSymptom: "Tiada simptom",
        mild: "Ringan",
        severe: "Teruk",


        bloodPressure: "Tekanan Darah",
        sys: "SIS",
        dia: "DIA",
        pulseShort: "NADI",


        symptomStable: "Stabil",
        symptomMonitor: "Perlu Pantau",
        symptomHighRisk: "Risiko Tinggi",


        symptoms: {
          breathlessness: "Lebih letih atau sesak nafas semasa aktiviti",
          swelling: "Kaki lebih bengkak",
          sleeping: "Guna lebih banyak bantal atau duduk semasa tidur",
          cough: "Lebih banyak batuk",
          abdomen: "Lebih tidak selesa/bengkak pada abdomen",
          currentLevel: "Tahap semasa",
        },

        weeklyTrend: {
          title: "Trend Pemeriksaan Kendiri Mingguan",
          description: "Menunjukkan trend mingguan untuk berat badan, tekanan darah, nadi dan skor simptom.",
          weightTrend: "Trend Berat Badan",
          bpPulseTrend: "Trend Tekanan Darah & Nadi",
          symptomTrend: "Trend Skor Simptom",
          symptomDescription: "Jumlah skor adalah berdasarkan 5 modul simptom. Skor yang lebih tinggi menunjukkan simptom yang lebih serius.",
          weightKg: "Berat Badan (kg)",
          originalDryWeight: "Berat Kering Asal",
          systolic: "Tekanan Sistolik",
          diastolic: "Tekanan Diastolik",
          pulse: "Nadi",
          symptomScore: "Skor Simptom",
        },
        vitalsLoggedMessage: "Bacaan vital telah direkodkan untuk {{date}}.",
        confirmVitals: "Adakah anda pasti mahu menghantar bacaan vital ini untuk {{date}}?",


        scanMonitor: "Imbas Monitor",
        manualEntry: "Masukan Manual",
        uploadImage: "Klik untuk memuat naik gambar",
        useCamera: "Guna Kamera",
        capturePhoto: "Tangkap Gambar",
        processImage: "Proses Gambar",
        uploadDifferent: "Muat Naik Gambar Lain",
        annotatedResult: "Keputusan Beranotasi:",
        verifyEdit: "Semak & Edit Nilai",
        recordedAt: "Direkodkan pada",
        recordingAt: "Merekod pada",
        saveResult: "Simpan Keputusan",
        saveReading: "Simpan Bacaan",
        systolic: "Sistolik (mmHg)",
        diastolic: "Diastolik (mmHg)",
        pulse: "Nadi (bpm)",


        recentReadings: "Bacaan Terkini",
        noReadings: "Belum ada bacaan direkodkan.",


        invalidWeightTitle: "Berat Tidak Sah",
        invalidWeightDesc: "Sila masukkan berat yang sah sekurang-kurangnya 20kg.",
        confirmWeight: "Adakah anda pasti mahu menghantar bacaan berat ini untuk {{date}}?",
        confirmSymptoms: "Adakah anda pasti mahu menghantar penilaian simptom ini untuk {{date}}?",


        cancel: "Batal",
        confirm: "Sahkan",
        ok: "OK",


        pictureGuideTitle: "Cara Mengambil Gambar Yang Baik",
        pictureGuideDesc:
          "Sila pastikan monitor tekanan darah berada di tengah dan tegak, bukan senget. Ini membantu sistem kami membaca nilai dengan tepat.",
        correct: "Betul",
        incorrect: "Salah",
        correctDesc: "Monitor lurus dan jelas kelihatan",
        incorrectDesc: "Monitor senget atau tidak berada di tengah",
        gotIt: "Faham / Teruskan",


        toast: {
          weightSaved: "Berat berjaya disimpan",
          weightFailed: "Gagal menyimpan berat",
          symptomsSaved: "Simptom berjaya disimpan",
          symptomsFailed: "Gagal menyimpan simptom",
          identifyUser: "Tidak dapat mengenal pasti pengguna. Sila log masuk semula.",
          scanComplete: "Imbasan selesai! Sila semak dan simpan bacaan.",
          processImageFailed: "Gagal memproses gambar. Sila cuba lagi dengan gambar yang lebih jelas.",
          bpSaved: "Bacaan tekanan darah berjaya disimpan!",
          vitalsFailed: "Gagal menyimpan bacaan vital",
          cameraUnsupported: "Akses kamera tidak disokong dalam pelayar ini. Sila gunakan pelayar moden atau muat naik gambar.",
          cameraDenied: "Kebenaran kamera ditolak. Sila benarkan akses kamera dalam tetapan pelayar anda.",
          cameraNotFound: "Tiada kamera ditemui pada peranti ini. Sila muat naik gambar.",
          cameraFailed: "Gagal mengakses kamera. Sila semak kebenaran atau muat naik gambar.",
          enterVitals: "Sila masukkan sistolik, diastolik dan nadi.",
        },


        weightScanner: {
          title: "Pengimbas Berat",
          description:
            "Muat naik atau ambil gambar paparan mesin penimbang. Nilai yang dikesan akan diisi secara automatik dalam ruangan berat.",
          uploadPhoto: "Muat naik gambar mesin penimbang",
          useCamera: "Guna Kamera",
          capturePhoto: "Ambil Gambar Berat",
          scanPhoto: "Imbas Berat daripada Gambar",
          removePhoto: "Buang Gambar",
          detectedWeight: "Berat yang dikesan",
          notDetected: "Tidak dikesan",
          editDetectedWeight: "Anda boleh mengubah nilai yang dikesan di bawah sebelum menyimpan.",
          selectPhotoFirst: "Sila pilih gambar mesin penimbang terlebih dahulu.",
          detectedToast: "Berat dikesan: {{weight}} kg",
          notDetectedToast:
            "Berat tidak dapat dikesan dengan jelas. Sila ambil semula gambar di tempat yang terang dan pastikan paparan lurus.",
          scanFailedToast: "Gagal mengimbas gambar berat.",
          previewAlt: "Pratonton Berat",
          ocrResultAlt: "Keputusan OCR Berat",
          photoGuideTitle: "Cara mengambil gambar yang jelas",
          photoGuideDesc: "Sila ambil gambar paparan penimbang berat dengan jelas.",
          correct: "Gambar yang betul",
          incorrect: "Gambar yang salah",
          correctDesc: "Pastikan nombor berat dekat, jelas dan dapat dilihat sepenuhnya.",
          incorrectDesc: "Elakkan mengambil gambar terlalu jauh atau menutupi paparan penimbang.",
          gotIt: "Faham",
        },
      },


      schedule: {
        title: "Jadual",
        subtitle: "Urus janji temu dan peringatan anda",
        appointments: "Janji Temu",
        reminders: "Peringatan",
        medicationReminder: "Peringatan Ubat",
        followUpVisit: "Lawatan Susulan",
        addSchedule: "Tambah Jadual",
        date: "Tarikh",
        time: "Masa",
        description: "Penerangan",
        noSchedule: "Tiada jadual tersedia",
      },


      vitals: {
        title: "Penjejak Vital",
        subtitle: "Jejaki tanda vital penting anda",
        heartRate: "Kadar Denyutan Jantung",
        bloodPressure: "Tekanan Darah",
        oxygenLevel: "Tahap Oksigen",
        bodyTemperature: "Suhu Badan",
        respiratoryRate: "Kadar Pernafasan",
        recordVitals: "Rekod Vital",
        latestReading: "Bacaan Terkini",
        history: "Sejarah",
      },


      education: {
        pageTitle: "Pendidikan",
        pageDescription:
          "Pelajari pengetahuan penjagaan kendiri kegagalan jantung melalui bahan bacaan dan video.",
        searchPlaceholder: "Cari kandungan pendidikan...",
        searchAria: "Cari kandungan pendidikan",
        moduleLabel: "Modul",
        closeContent: "Tutup kandungan",
        learningContent: "Kandungan Pembelajaran",
        viewSource: "Lihat Sumber",
        hideSubmodules: "Sembunyikan Topik",
        showSubmodules: "Tunjukkan Topik",
        readContent: "Baca Kandungan",
        collectPointAndPlay: "Kumpul Mata & Mainkan Video",


        featuresTitle: "Ciri Pendidikan",
        featuresFooter:
          "Bahagian pendidikan ini membantu pesakit memahami kegagalan jantung dan meningkatkan penjagaan kendiri harian.",
        features: {
          guides: "Panduan kegagalan jantung yang mudah",
          structured: "Modul pembelajaran yang tersusun",
          warning: "Tanda amaran dan tips penjagaan kendiri",
        },


        videoSectionTitle: "Kumpul Syiling dengan Menonton Video Pendidikan",
        videoSectionDescription:
          "Tonton video sekurang-kurangnya {{seconds}} saat untuk menuntut {{coins}} syiling. Setiap video hanya boleh dituntut sekali.",
        reward: "Ganjaran: {{coins}} syiling",
        startWatching: "Mula Menonton untuk Syiling",
        watchingProgress: "Kemajuan tontonan",
        continueWatching: "Teruskan Menonton",
        addingCoins: "Sedang Menambah Syiling...",
        claimCoins: "Tuntut {{coins}} Syiling",
        coinsAlreadyClaimed: "Syiling telah dituntut",
        coinsAdded: "{{coins}} syiling berjaya ditambah!",
        failedAddCoins: "Gagal menambah syiling. Sila cuba lagi.",
        seconds: "saat",


        videos: {
          heartFailureBasic: {
            title: "Memahami Kegagalan Jantung",
            description:
              "Pelajari maksud asas kegagalan jantung, simptom biasa, dan kepentingan pemantauan harian.",
          },
          lowSaltDiet: {
            title: "Panduan Diet Rendah Garam",
            description:
              "Pelajari mengapa mengurangkan pengambilan garam penting untuk pesakit kegagalan jantung.",
          },
          fluidManagement: {
            title: "Pengurusan Pengambilan Cecair",
            description:
              "Pelajari mengapa pesakit kegagalan jantung mungkin perlu mengawal pengambilan air dan cecair harian.",
          },
        },


        modules: {
          A: {
            title: "Memahami Kegagalan Jantung",
            description:
              "Pelajari maksud kegagalan jantung, bagaimana ia berlaku, dan simptom biasa.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Pengenalan asas tentang kegagalan jantung.",
                content:
                  "Kegagalan jantung bermaksud jantung tidak dapat mengepam darah sebaik yang diperlukan oleh badan. Ia tidak bermaksud jantung telah berhenti, tetapi jantung memerlukan sokongan dan pemantauan harian yang teliti.",
              },
              whatIsHF: {
                title: "Apakah Kegagalan Jantung?",
                description: "Fahami maksud kegagalan jantung.",
                content:
                  "Kegagalan jantung berlaku apabila otot jantung menjadi lemah atau kaku. Ini boleh menyebabkan keletihan, sesak nafas, bengkak, dan kesukaran melakukan aktiviti harian.",
              },
              symptoms: {
                title: "Simptom",
                description: "Simptom biasa kegagalan jantung.",
                content:
                  "Simptom biasa termasuk sesak nafas, kaki atau buku lali bengkak, kenaikan berat badan secara mendadak, keletihan, degupan jantung laju, dan sukar tidur dalam posisi baring.",
              },
              normalHeart: {
                title: "Bagaimana Jantung Berfungsi",
                description: "Pelajari bagaimana jantung normal mengepam darah.",
                content:
                  "Jantung yang sihat mengepam darah ke paru-paru dan seluruh badan. Darah membawa oksigen dan nutrien yang diperlukan oleh badan.",
              },
              types: {
                title: "Jenis Kegagalan Jantung",
                description: "Istilah berbeza dalam kegagalan jantung.",
                content:
                  "Kegagalan jantung boleh diterangkan dalam beberapa cara bergantung kepada cara jantung mengepam atau mengisi darah. Doktor mungkin menerangkannya menggunakan pecahan ejeksi dan keputusan ujian lain.",
              },
            },
          },


          B: {
            title: "Punca dan Keadaan Berkaitan",
            description:
              "Pelajari keadaan jantung dan penyakit lain yang boleh menyebabkan kegagalan jantung.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Gambaran keseluruhan punca kegagalan jantung.",
                content:
                  "Kegagalan jantung boleh disebabkan oleh beberapa keadaan berkaitan jantung atau badan. Memahami puncanya membantu pesakit mengurus kesihatan dengan lebih baik.",
              },
              commonHeartConditions: {
                title: "Keadaan Jantung Biasa",
                description: "Masalah jantung yang boleh menyebabkan kegagalan jantung.",
                content:
                  "Tekanan darah tinggi, penyakit arteri koronari, serangan jantung, penyakit injap jantung, dan ritma jantung tidak normal boleh meningkatkan risiko kegagalan jantung.",
              },
              otherMedicalConditions: {
                title: "Keadaan Perubatan Lain",
                description: "Penyakit lain yang berkaitan dengan kegagalan jantung.",
                content:
                  "Diabetes, penyakit buah pinggang, obesiti, penyakit paru-paru, dan masalah tiroid boleh menjejaskan jantung dan memburukkan simptom kegagalan jantung.",
              },
            },
          },


          C: {
            title: "Penjagaan Kendiri dan Pemantauan",
            description:
              "Pelajari cara memantau badan dan mengurus kegagalan jantung setiap hari.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Mengapa penjagaan kendiri harian penting.",
                content:
                  "Penjagaan kendiri harian membantu pesakit mengenal pasti perubahan lebih awal. Pesakit perlu memantau berat badan, tekanan darah, nadi, simptom, pengambilan air, pengambilan garam, dan penggunaan ubat.",
              },
              bloodPressurePulse: {
                title: "Tekanan Darah dan Nadi",
                description: "Cara memantau tekanan darah dan nadi.",
                content:
                  "Periksa tekanan darah dan nadi secara berkala. Bacaan yang terlalu tinggi, terlalu rendah, atau luar biasa perlu direkodkan dan dimaklumkan kepada penyedia penjagaan kesihatan.",
              },
              lifestyleChanges: {
                title: "Perubahan Gaya Hidup",
                description: "Tabiat sihat untuk kegagalan jantung.",
                content:
                  "Tabiat sihat termasuk mengurangkan garam, mengawal pengambilan cecair, melakukan senaman yang sesuai, berhenti merokok, mengehadkan alkohol, dan mengikuti nasihat perubatan.",
              },
              managingMedicines: {
                title: "Pengurusan Ubat",
                description: "Ambil ubat dengan betul.",
                content:
                  "Ambil ubat seperti yang diarahkan oleh doktor. Jangan berhenti atau menukar ubat tanpa bertanya kepada penyedia penjagaan kesihatan.",
              },
              supportGroups: {
                title: "Kumpulan Sokongan",
                description: "Mendapat sokongan daripada orang lain.",
                content:
                  "Sokongan daripada keluarga, rakan, profesional kesihatan, dan kumpulan pesakit boleh membantu pesakit mengurus kegagalan jantung dengan lebih baik.",
              },
            },
          },


          D: {
            title: "Hidup dengan Kegagalan Jantung",
            description:
              "Tips praktikal untuk kehidupan harian, perjalanan, vaksin, dan kerja.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Hidup dengan selamat bersama kegagalan jantung.",
                content:
                  "Pesakit kegagalan jantung masih boleh menjalani kehidupan yang bermakna dengan merancang aktiviti harian, mengikuti rawatan, dan mengenal pasti tanda amaran lebih awal.",
              },
              travel: {
                title: "Perjalanan",
                description: "Tips perjalanan untuk pesakit kegagalan jantung.",
                content:
                  "Sebelum melancong, sediakan ubat yang mencukupi, semak dokumen perubatan, elakkan terlalu penat, dan berbincang dengan doktor jika simptom tidak stabil.",
              },
              vaccines: {
                title: "Vaksinasi",
                description: "Mengapa vaksin mungkin penting.",
                content:
                  "Vaksinasi boleh mengurangkan risiko jangkitan yang boleh memburukkan kegagalan jantung. Pesakit perlu bertanya kepada doktor vaksin yang sesuai.",
              },
              workAdjustments: {
                title: "Penyesuaian Kerja",
                description: "Mengurus kerja dan tanggungjawab harian.",
                content:
                  "Sesetengah pesakit mungkin memerlukan waktu rehat, tugas yang lebih ringan, atau jadual fleksibel bergantung kepada simptom dan nasihat doktor.",
              },
              emotions: {
                title: "Emosi Anda",
                description: "Mengurus perasaan dan perubahan emosi.",
                content:
                  "Hidup dengan kegagalan jantung boleh menyebabkan tekanan, kebimbangan, kesedihan, atau ketakutan. Bercakap dengan keluarga, rakan, kumpulan sokongan, atau profesional kesihatan boleh membantu.",
              },
            },
          },


          E: {
            title: "Untuk Penjaga",
            description:
              "Maklumat untuk ahli keluarga dan penjaga yang menyokong pesakit kegagalan jantung.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Memahami peranan penjaga.",
                content:
                  "Penjaga memainkan peranan penting dalam menyokong pesakit kegagalan jantung dari segi ubat-ubatan, janji temu, pemantauan harian, dan sokongan emosi.",
              },
              howToHelp: {
                title: "Cara Membantu",
                description: "Cara penjaga boleh menyokong pesakit.",
                content:
                  "Penjaga boleh membantu dengan mengingatkan pesakit mengambil ubat, memantau simptom, menghadiri janji temu, mengikuti nasihat diet, dan mendapatkan bantuan perubatan apabila tanda amaran muncul.",
              },
              caringStress: {
                title: "Menjaga Pesakit Boleh Mencabar",
                description: "Mengurus tekanan sebagai penjaga.",
                content:
                  "Menjaga seseorang boleh memenatkan dan memberi tekanan. Penjaga juga perlu berehat, meminta bantuan, dan menjaga kesihatan sendiri.",
              },
              financialConcerns: {
                title: "Kebimbangan Kewangan",
                description: "Mengurus kebimbangan berkaitan kos.",
                content:
                  "Kos perubatan, perjalanan, ubat-ubatan, dan keperluan penjagaan boleh memberi tekanan kewangan. Keluarga boleh berbincang tentang sokongan yang tersedia dengan petugas kesihatan atau perkhidmatan komuniti.",
              },
              supportServices: {
                title: "Perkhidmatan Sokongan",
                description: "Mencari sokongan yang berguna.",
                content:
                  "Perkhidmatan sokongan boleh merangkumi pasukan kesihatan, kumpulan pesakit, kaunseling, pekerja sosial, dan organisasi komuniti.",
              },
            },
          },


          H: {
            title: "Tanda Amaran",
            description:
              "Pelajari tanda amaran yang mungkin memerlukan perhatian perubatan.",
            submodules: {
              introduction: {
                title: "Pengenalan",
                description: "Mengenal pasti tanda amaran lebih awal.",
                content:
                  "Simptom kegagalan jantung boleh menjadi teruk dengan cepat. Pesakit perlu mengetahui tanda amaran dan mendapatkan nasihat perubatan apabila simptom menjadi serius.",
              },
              shortnessOfBreath: {
                title: "Sesak Nafas",
                description: "Kesukaran bernafas sebagai tanda amaran.",
                content:
                  "Sesak nafas ketika berehat, semasa baring, atau secara tiba-tiba pada waktu malam mungkin menjadi tanda bahawa kegagalan jantung semakin teruk.",
              },
              chestPain: {
                title: "Sakit Dada",
                description: "Sakit dada tidak boleh diabaikan.",
                content:
                  "Sakit dada, rasa ketat, atau tekanan pada dada mungkin serius. Pesakit perlu mendapatkan bantuan perubatan segera jika sakit dada berlaku.",
              },
              rapidWeightGain: {
                title: "Kenaikan Berat Badan Mendadak",
                description: "Kenaikan berat badan mendadak mungkin menunjukkan penahanan cecair.",
                content:
                  "Kenaikan berat badan secara tiba-tiba mungkin menunjukkan badan menyimpan cecair. Pesakit perlu merekod berat badan setiap hari dan melaporkan perubahan yang luar biasa.",
              },
              swellingLegs: {
                title: "Bengkak pada Kaki atau Buku Lali",
                description: "Bengkak mungkin menunjukkan pengumpulan cecair.",
                content:
                  "Bengkak pada kaki, buku lali, tapak kaki, atau abdomen mungkin disebabkan oleh pengumpulan cecair dan perlu dipantau dengan teliti.",
              },
            },
          },
        },
      },


      helpSupport: {
        title: "Bantuan & Sokongan",
        subtitle: "Dapatkan bantuan, panduan kecemasan dan sokongan penggunaan MyHFGuard.",


        aboutTitle: "Tentang MyHFGuard",
        aboutBody: "MyHFGuard membantu pesakit kegagalan jantung memantau simptom, mengurus peringatan, merekod data kesihatan harian dan mempelajari penjagaan diri dengan lebih mudah.",


        contactUs: "Hubungi Kami",
        needHelp: "Pilih kaedah bantuan yang sesuai di bawah.",


        emergencyContact: "Hubungan Kecemasan",
        emergencyBody: "Jika anda mengalami sesak nafas teruk, sakit dada, pengsan atau keadaan kecemasan lain, sila hubungi perkhidmatan kecemasan dengan segera. Jangan bergantung pada aplikasi ini untuk rawatan segera.",


        supportTitle: "Sokongan Emel",
        supportBody: "Untuk masalah teknikal atau sokongan sistem, sila hubungi pasukan sokongan MyHFGuard melalui emel.",


        whatsappTitle: "Sokongan WhatsApp",
        whatsappBody: "Untuk komunikasi pantas, anda juga boleh menghubungi sokongan melalui WhatsApp.",


        callButton: "Hubungi Kecemasan (999)",
        emailButton: "Emel Sokongan",
        whatsappButton: "Buka WhatsApp",


        disclaimer: "Aplikasi ini hanya untuk sokongan penjagaan diri dan tidak menggantikan nasihat, diagnosis atau rawatan perubatan profesional."
      },


      medication: {
        title: "Ubat",
        subtitle: "Urus jadual ubat anda",
        medicineName: "Nama Ubat",
        dosage: "Dos",
        frequency: "Kekerapan",
        reminderTime: "Masa Peringatan",
        addMedication: "Tambah Ubat",

        time: {
          noonShort: "12:00 PM",
          nightShort: "10:00 PM",
        },
      },


      aiAssistant: {
        title: "Pembantu AI",
        subtitle: "Tanya soalan tentang simptom anda dan penjagaan kegagalan jantung",
        placeholder: "Taip mesej anda di sini...",
        send: "Hantar",

        patientSummary: "Ringkasan Pesakit",
        patientSummaryDesc: "Data asas yang digunakan untuk menyokong jawapan AI",
        basicInfo: "Maklumat Asas",
        latestHealthStatus: "Status Kesihatan Terkini",
        medicationReminder: "Peringatan Ubat",
        name: "Nama",
        age: "Umur",
        baselineDryWeight: "Berat Kering Asas",
        latestWeight: "Berat Terkini",
        weightChange: "Perubahan Berat",
        latestBP: "Tekanan Darah Terkini",
      },


      waterDiet: {
          title: "Air & Diet Garam Rendah Saya",
          description: "Pantau pengambilan cecair harian dan amalkan diet yang sihat untuk jantung.",
          subtitle: "Sila hantar setiap hari atau sekurang-kurangnya 3 kali seminggu.",
          today: "hari ini",
          buttons: {
            saving: "Menyimpan...",
            save: "Simpan Rekod untuk {{date}}",
          },

          toast: {
            unableSession: "Tidak dapat memuatkan sesi",
            loginFirst: "Sila log masuk dahulu",
            fillWater: "Sila masukkan had air dan pilih bilangan cawan",
            saved: "Air dan diet garam rendah berjaya disimpan",
            failed: "Gagal menyimpan rekod",
          },


          weekly: {
            title: "Status Penjejakan Mingguan",
            entries: "Entri minggu ini",
            target: "Sasaran",
            targetValue: "3 kali",
            status: "Status",
            onTrack: "Mengikut Jadual",
            needMore: "Perlukan Lebih Entri",
          },


          waterCard: {
            title: "Pengambilan Air Saya",
            limitLabel: "Had Air Doktor (ml)",
            placeholder: "Contoh: 800",
            selectLabel: "Pilih Pengambilan Air Hari Ini (8 cawan)",
            selectedIntake: "Pengambilan Dipilih",
            limitText: "Had",
          },


          waterStatus: {
            green: "Dalam Julat",
            orange: "Sedikit Melebihi Julat",
            red: "Melebihi Had",
          },


          saltCard: {
            title: "Diet Garam Rendah Saya",
            dailyScore: "Skor Garam Harian",
          },


          saltOptions: {
            natural: "Semula Jadi / Garam Rendah",
            moderate: "Garam Sederhana",
            high: "Garam Tinggi",
          },


          saltStatus: {
            green: "Garam Rendah",
            orange: "Garam Sederhana",
            red: "Garam Tinggi",
          },


          meals: {
            breakfast: "Sarapan",
            lunch: "Makan Tengah Hari",
            dinner: "Makan Malam",
          },


          summary: {
            title: "Ringkasan Terkini",
            waterRestriction: "Had Air",
            todayWater: "Pengambilan Air Hari Ini",
            waterStatus: "Status Air",
            saltStatus: "Status Garam",
          },


          charts: {
            waterGraph: "Graf Pengambilan Air",
            saltGraph: "Graf Diet Garam Rendah",
            waterLine: "Pengambilan Air (ml)",
            limitLine: "Had (ml)",
            saltBar: "Skor Garam",
          },


          error: {
            loadTitle: "Gagal memuatkan data air dan garam.",
            loadDesc: "Sila pastikan jadual water_salt_logs wujud dalam Supabase dan polisi RLS telah ditambah.",
          },
        },


      profile: {
        myProfile: "Profil Saya",
        profileDesc: "Urus maklumat peribadi, kesihatan dan pilihan aplikasi anda.",
        baselineLocked: "Data Asas Dikunci",
        baselineNotice:
          "Data asas kesihatan anda telah dikunci. Anda masih boleh mengemas kini ubat-ubatan dan pilihan bahasa.",
        personalInformation: "Maklumat Peribadi",
        fullName: "Nama Penuh",
        enterFullName: "Masukkan nama penuh",
        age: "Umur",
        enterAge: "Masukkan umur",
        icNumber: "Nombor IC",
        enterIcNumber: "Masukkan nombor IC",
        preferences: "Pilihan",
        language: "Bahasa",
        useTopLanguageButton:
          "gunakan butang bahasa di bahagian atas untuk menukar bahasa seluruh aplikasi.",
        baselineHealthData: "Data Kesihatan Asas",
        bloodPressureSystolic: "Tekanan Darah Sistolik",
        bloodPressureDiastolic: "Tekanan Darah Diastolik",
        heartRate: "Kadar Denyutan Jantung",
        dryWeight: "Berat Kering",
        height: "Tinggi",
        bmi: "BMI",
        currentMedication: "Ubat Semasa",
        enterCurrentMedication: "Masukkan ubat semasa: Aspirin(tengah hari), Atorvastatin(malam)",
        saveProfile: "Simpan Profil",
        saving: "Sedang menyimpan...",
        loadingProfile: "Sedang memuatkan profil...",
        autoCalculated: "Dikira secara automatik",
        systolicPlaceholder: "cth. 120",
        diastolicPlaceholder: "cth. 80",
        heartRatePlaceholder: "cth. 72",
        dryWeightPlaceholder: "cth. 60",
        heightPlaceholder: "cth. 160",
        userSessionNotFound: "Sesi pengguna tidak dijumpai. Sila log masuk semula.",
        failedToSaveProfile: "Gagal menyimpan profil.",
        profileSavedSuccessfully: "Profil berjaya disimpan!",
        somethingWentWrongSaving: "Sesuatu berlaku semasa menyimpan profil.",
      },


    coin: {
      coinCollection: "Koleksi Syiling",
      coinsEarnedFromEducationVideos: "Syiling diperoleh daripada video pendidikan",
      refreshCoins: "Segar Semula Syiling",
      refreshing: "Sedang menyegar semula...",
      failedToRefreshCoins: "Gagal menyegar semula syiling.",
    },
    },


  },
}


i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})


export default i18n

