function normalizeUserId(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 30);
}

function defaultUserId(patientId) {
    const compact = String(patientId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `patient${compact.slice(0, 8) || Date.now().toString().slice(-8)}`;
}

function userIdFromEmail(email) {
    const value = String(email || '').trim().toLowerCase();
    if (!value.endsWith('@myhfguard.local')) return null;
    return normalizeUserId(value.split('@')[0]);
}

module.exports = (supabase) => async (req, res) => {
    try {
        const patientId = req.query.patientId;

        let query = supabase.from('patients').select('*');
        if (patientId) query = query.eq('patient_id', patientId);

        const { data: patients, error: patientError } = await query;

        if (patientError) {
            console.error('Error fetching patients:', patientError);
            return res.status(400).json({ error: patientError.message });
        }

        const ids = (patients || []).map((patient) => patient.patient_id).filter(Boolean);
        let profileMap = new Map();

        if (ids.length > 0) {
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('user_id,full_name,assigned_user_id,profile_completed,target_steps,created_at')
                .in('user_id', ids);

            if (profileError) {
                console.warn('Unable to load patient profiles:', profileError.message);
            } else {
                profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
            }
        }

        const transformedPatients = [];

        for (const patient of patients || []) {
            let profile = profileMap.get(patient.patient_id) || {};
            let authUser = null;

            try {
                const authResult = await supabase.auth.admin.getUserById(patient.patient_id);
                if (!authResult.error) authUser = authResult.data && authResult.data.user;
            } catch (error) {
                console.warn(`Unable to load auth user ${patient.patient_id}:`, error.message);
            }

            let assignedUserId = normalizeUserId(
                patient.assigned_user_id ||
                profile.assigned_user_id ||
                userIdFromEmail(authUser && authUser.email) ||
                defaultUserId(patient.patient_id)
            );

            if (!assignedUserId) assignedUserId = defaultUserId(patient.patient_id);

            if (!patient.assigned_user_id || !profile.assigned_user_id) {
                const patientUpdate = await supabase
                    .from('patients')
                    .update({ assigned_user_id: assignedUserId })
                    .eq('patient_id', patient.patient_id);

                if (patientUpdate.error) {
                    console.warn(`Unable to backfill patients.assigned_user_id for ${patient.patient_id}:`, patientUpdate.error.message);
                }

                const profileUpdate = await supabase
                    .from('profiles')
                    .upsert({
                        user_id: patient.patient_id,
                        assigned_user_id: assignedUserId,
                        profile_completed: !!profile.profile_completed,
                    }, { onConflict: 'user_id' })
                    .select('user_id,full_name,assigned_user_id,profile_completed,target_steps,created_at')
                    .maybeSingle();

                if (profileUpdate.error) {
                    console.warn(`Unable to backfill profiles.assigned_user_id for ${patient.patient_id}:`, profileUpdate.error.message);
                } else if (profileUpdate.data) {
                    profile = profileUpdate.data;
                    profileMap.set(patient.patient_id, profileUpdate.data);
                }
            }

            // Existing passwords are not reset. Only the Auth email/login identifier is
            // changed to the assigned User ID alias so the same password continues to work.
            if (authUser && !userIdFromEmail(authUser.email)) {
                const loginEmail = `${assignedUserId}@myhfguard.local`;
                const authUpdate = await supabase.auth.admin.updateUserById(patient.patient_id, {
                    email: loginEmail,
                    email_confirm: true,
                    app_metadata: {
                        ...(authUser.app_metadata || {}),
                        role: 'patient',
                        assigned_user_id: assignedUserId,
                    },
                });

                if (authUpdate.error) {
                    console.warn(`Unable to assign login ID for ${patient.patient_id}:`, authUpdate.error.message);
                } else {
                    authUser = authUpdate.data && authUpdate.data.user;
                }
            }

            transformedPatients.push({
                patient_id: patient.patient_id,
                assigned_user_id: assignedUserId,
                first_name: patient.first_name,
                last_name: patient.last_name,
                full_name: profile.full_name || null,
                date_of_birth: patient.date_of_birth || patient.dob,
                created_at: patient.created_at || profile.created_at || (authUser && authUser.created_at),
                email: authUser && authUser.email ? authUser.email : null,
                last_sign_in_at: authUser && authUser.last_sign_in_at ? authUser.last_sign_in_at : null,
                profile_completed: !!profile.profile_completed,
                target_steps: profile.target_steps || 3000,
            });
        }

        res.status(200).json({ patients: transformedPatients });
    } catch (err) {
        console.error('Unexpected error in getPatients:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
