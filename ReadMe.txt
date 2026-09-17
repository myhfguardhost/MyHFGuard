MYHFGUARD
Final Year Project Source Code, Installation and Deployment Guide
=================================================================

1. PROJECT OVERVIEW
-------------------
MyHFGuard is a heart-failure self-management system consisting of:

1. A patient web application.
2. An administrator web application.
3. An Android mobile application.
4. A Node.js and Express backend API.
5. Python-based blood-pressure and weight OCR processing.
6. A Supabase PostgreSQL database and Supabase Authentication.
7. Google Gemini API integration for AI-assisted health guidance.
8. Health Connect integration for synchronising supported wearable data.

The system allows patients to record and review health information, including
blood pressure, weight, symptoms, water and salt intake, exercise, medication
and reminders. Administrators can manage patients, review alerts, examine
patient details and generate reports.


2. SUBMISSION CONTENTS
----------------------
The final submission ZIP should use a structure similar to the following:

MyHFGuard_FYP_Submission/
|-- ReadMe.txt
|-- Source_Code/
|   |-- MyHFGuard-Web-Backend/
|   |   |-- src/
|   |   |-- public/
|   |   |-- server/
|   |   |   |-- digit_recognition_backend.py
|   |   |   |-- weight_recognition_backend.py
|   |   |   |-- requirements.txt
|   |   |   |-- supabase_water_salt_setup.sql
|   |   |   `-- migrations/20260721_patient_user_ids.sql
|   |   |-- package.json
|   |   |-- package-lock.json
|   |   |-- vite.config.ts
|   |   `-- other configuration files
|   `-- MyHFGuard-Android/
|       |-- app/
|       |   `-- build.gradle.kts
|       |-- gradle/
|       |-- settings.gradle.kts
|       |-- gradlew
|       `-- gradlew.bat
`-- Videos/

The names may be adjusted, but the same main content should be included.


3. IMPORTANT SECURITY NOTICE
----------------------------
Do not include real secret credentials in the submission ZIP.

The following must not be included:

* Supabase service-role key
* Gemini API key
* Administrator or patient passwords
* Local .env files containing real credentials
* Android signing keys

Provide only example configuration files with placeholder values. The
Supabase anonymous/publishable key is intended for client applications, but
Row Level Security must be enabled and configured correctly before use.


4. SYSTEM REQUIREMENTS
----------------------

Web and Backend Development
* Windows 10 or Windows 11
* Node.js 20 LTS or later
* npm
* Python 3.10 or later
* Git
* Google Chrome, Microsoft Edge or another modern browser

Android Development
* Android Studio
* Java Development Kit 17
* Android SDK 36
* Android device or emulator with Android 8.0 (API 26) or later
* Health Connect installed or available on the device

Cloud Services
* Supabase project
* Google Gemini API key
* GitHub account for GitHub Pages deployment
* Render account for backend deployment


5. WEB FRONTEND: LOCAL INSTALLATION
-----------------------------------

Step 1: Open PowerShell or the Visual Studio Code terminal.

Step 2: Change to the web project directory:

    cd MyHFGuard-Web-Backend

Step 3: Install the frontend packages:

    npm install

Step 4: Create a frontend .env file in the project root. Use the following
variables and replace the placeholder values:

    VITE_SERVER_URL=http://localhost:3001
    VITE_SUPABASE_URL=<your-supabase-project-url>
    VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
    VITE_PATIENT_LOGIN_DOMAIN=myhfguard.local

Step 5: Start the frontend development server:

    npm run dev

Step 6: Open the URL displayed by Vite. The default local URL is:

    http://localhost:5173


6. BACKEND AND OCR: LOCAL INSTALLATION
--------------------------------------

Step 1: Open another terminal and enter the server directory:

    cd MyHFGuard-Web-Backend\server

Step 2: Install the Node.js backend packages:

    npm install

Step 3: Install the Python OCR packages:

    pip install -r requirements.txt

The backend uses Python, OpenCV and Tesseract-based processing for supported
blood-pressure and weight images. If Tesseract is not available through the
system path, install Tesseract OCR before testing OCR functions.

Step 4: Copy server/.env.example to server/.env and configure:

    PORT=3001
    NODE_ENV=production
    SUPABASE_URL=<your-supabase-project-url>
    SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
    SUPABASE_ANON_KEY=<your-supabase-anon-key>
    PATIENT_LOGIN_DOMAIN=myhfguard.local
    GEMINI_API_KEY=<your-gemini-api-key>
    GEMINI_MODEL=gemini-2.5-flash-latest

The service-role key must be stored only on the backend. Never place it in a
frontend or Android configuration file.

Step 5: Start the backend:

    npm start

The default backend URL is:

    http://localhost:3001

Step 6: Verify that the backend is running:

    http://localhost:3001/health

Step 7: Verify Supabase connectivity when required:

    http://localhost:3001/debug/connectivity


7. SUPABASE DATABASE SETUP
--------------------------

1. Open the existing MyHFGuard Supabase project.
2. Confirm that the required tables, constraints, functions and Row Level
   Security policies are present.
3. Configure Authentication for patient and administrator accounts.
4. Add the Supabase project URL and appropriate keys to the frontend, backend
   and Android configuration.

The current source package contains these database-related files:

    server/sample_database.txt
    server/supabase_water_salt_setup.sql
    server/migrations/20260721_patient_user_ids.sql

These files document the project database and selected setup/migration steps.
They are not claimed to be one complete, clean rebuild of the current live
database. A fresh full Supabase schema export should be added separately only
if the supervisor requires the database to be recreated from an empty project.

Important current data areas include patient profiles, blood-pressure
readings, weight records, symptom logs, water and salt logs, exercise goals,
wearable health records, medication/reminders, education-video rewards,
notifications and password-help requests.

Do not run obsolete SQL scripts that recreate previously removed legacy
tables. Review SQL against the current live schema before execution.


8. ANDROID APPLICATION SETUP
----------------------------

Step 1: Open the MyHFGuard-Android folder in Android Studio.

Step 2: Allow Gradle synchronization to complete.

Step 3: Copy local.properties.example to local.properties and configure the
Android SDK path as required. Example:

    sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk

In the current Android source, the Supabase URL and publishable/anonymous key
are read from:

    app/src/main/res/values/strings.xml

Only a publishable/anonymous client key may be used there. Never add the
Supabase service-role key to the Android application.

Step 4: Confirm that server_base_url and api_base_url in strings.xml point to
the required backend. For the deployed version, the current address is:

    https://myhfguard.onrender.com

Step 5: Connect an Android device or start an emulator.

Step 6: Build and run the application using Android Studio. Alternatively,
build a debug APK from PowerShell:

    gradlew.bat assembleDebug

The normal debug APK location is:

    app\build\outputs\apk\debug\app-debug.apk

Step 7: For wearable synchronization, install or enable Health Connect and
grant the health-data permissions requested by MyHFGuard. Mi Smart Band data
must first be synchronised to Mi Fitness and then shared through Health
Connect.

The mobile application uses Room/SQLite as temporary offline storage for
pending steps, heart-rate, SpO2 and distance records before synchronization.


9. WEB PRODUCTION BUILD
-----------------------

From the web project directory, run:

    npm install
    npm run build

The production output is generated in the dist folder. Build output does not
need to be included with source code unless specifically requested by the
lecturer, because it can be recreated from the supplied source files.


10. GITHUB PAGES DEPLOYMENT
---------------------------

The repository contains this workflow:

    .github/workflows/deploy-web.yml

The workflow installs the frontend packages, builds the Vite application and
publishes the dist folder to GitHub Pages whenever the main branch is pushed.

Configure the following GitHub repository secrets:

    VITE_SERVER_URL
    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY

In GitHub, open Settings > Pages and select GitHub Actions as the deployment
source. Push the final source code to the main branch to trigger deployment.

Current web application URL:

    https://myhfguardhost.github.io/MyHFGuard/


11. RENDER BACKEND DEPLOYMENT
-----------------------------

1. Create a new Render Web Service connected to the GitHub repository.
2. Configure the service to use the server directory.
3. Deploy using server/Dockerfile.
4. Add these environment variables in Render:

       SUPABASE_URL
       SUPABASE_SERVICE_ROLE_KEY
       SUPABASE_ANON_KEY
       PATIENT_LOGIN_DOMAIN
       GEMINI_API_KEY
       GEMINI_MODEL
       NODE_ENV=production

   Render supplies PORT automatically.

5. Deploy the service.
6. Verify the health endpoint after deployment:

       https://myhfguard.onrender.com/health

7. Verify database connectivity when required:

       https://myhfguard.onrender.com/debug/connectivity

The free Render instance may enter sleep mode after inactivity. Therefore,
the first request can take additional time while the service starts.


12. MAIN SYSTEM FUNCTIONS
-------------------------

Patient Web Application
* Patient login using an administrator-assigned User ID
* Dashboard and health overview
* Education videos and coin rewards
* Weight, symptom and blood-pressure self-check
* Water and salt tracking
* Exercise goals and wearable-data display
* Medication and reminder management
* AI-assisted chat using Gemini
* Profile, language and password management
* Password-help request to administrator

Administrator Web Application
* Administrator authentication
* Dashboard summary
* Patient account management
* Patient detail and health-record review
* Severity-based Alert Centre
* Analytics and report generation
* Patient notifications
* Password-help request handling

Android Application
* Patient login
* Health Connect data collection
* Display and synchronization of steps, distance, heart rate and SpO2
* Background synchronization
* Reminder and health-log notifications
* Offline Room/SQLite queue for pending records


13. TROUBLESHOOTING
-------------------

Problem: The frontend cannot contact the backend.
Solution:
* Confirm that the backend is running.
* Check VITE_SERVER_URL.
* Open the /health endpoint.
* Check the browser console for network or CORS errors.

Problem: The backend cannot connect to Supabase.
Solution:
* Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.
* Open /debug/connectivity.
* Confirm that the required tables and policies exist.

Problem: Login fails.
Solution:
* Confirm that the User ID was assigned by the administrator.
* Confirm PATIENT_LOGIN_DOMAIN matches VITE_PATIENT_LOGIN_DOMAIN.
* Use the password-help option or contact the administrator.

Problem: OCR does not return a reading.
Solution:
* Confirm that Python dependencies and Tesseract OCR are installed.
* Capture a clear, straight image with good lighting.
* Ensure the complete display and measurement units are visible.
* Check backend logs for Python or image-processing errors.

Problem: Health Connect data is not synchronized.
Solution:
* Confirm that Health Connect is available.
* Grant all requested permissions.
* Synchronise the wearable device with Mi Fitness first.
* Confirm that the mobile device has internet access.
* Use the application synchronization function again.

Problem: The deployed backend responds slowly on the first request.
Solution:
* Wait for the Render free service to wake up, then retry.


14. FILES TO EXCLUDE FROM THE FINAL ZIP
---------------------------------------

Exclude generated, temporary and sensitive files:

* node_modules/
* .git/
* dist/
* build/
* .gradle/
* .idea/
* Android build_out/ or generated build folders
* .env files containing real credentials
* local.properties containing local paths or credentials
* temporary uploads, logs and cache files
* server_old_backup.js and other obsolete backup files

Keep package.json, package-lock.json, Gradle wrapper files, Python source files,
requirements.txt, Dockerfile, source assets and example configuration files.


15. RECORDED VIDEOS
-------------------

Place only videos recorded specifically for MyHFGuard in the Videos folder.
Do not include recordings belonging to another subject or project.

Recommended MyHFGuard recordings:

1. MyHFGuard System Demonstration
   Demonstrate the patient website, administrator website, Android health-data
   synchronization and the main completed functions.

2. MyHFGuard Setup or Deployment Demonstration
   Demonstrate the source-code folders, required configuration, local startup
   process and deployed system URLs.

The video file format may be MP4 or MOV. Before creating the submission ZIP,
play each video to confirm that it opens correctly and that important text is
readable.

Before creating the ZIP, play each video to confirm that it opens correctly
and that important text is readable.


16. FINAL SUBMISSION CHECKLIST
------------------------------

[ ] Web and administrator source code included
[ ] Node.js backend source code included
[ ] Python OCR source code and requirements.txt included
[ ] Android source code and Gradle wrapper included
[ ] Existing SQL documentation and migration files included
[ ] ReadMe.txt included at the top level
[ ] Recorded videos included and tested
[ ] package.json and package-lock.json included
[ ] No node_modules or generated build folders included
[ ] No real API secrets, service-role keys or passwords included
[ ] ZIP successfully extracts on another computer
[ ] Web production build has been tested
[ ] Android application has been tested
[ ] Backend /health endpoint has been tested


End of ReadMe.txt
