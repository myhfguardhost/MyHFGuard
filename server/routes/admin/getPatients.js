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



        const transformedPatients = (patients || []).map((patient) => {

            const profile = profileMap.get(patient.patient_id) || {};

            return {

                patient_id: patient.patient_id,

                assigned_user_id: patient.assigned_user_id || profile.assigned_user_id || null,

                first_name: patient.first_name,

                last_name: patient.last_name,

                full_name: profile.full_name || null,

                date_of_birth: patient.date_of_birth || patient.dob,

                created_at: patient.created_at || profile.created_at,

                email: null,

                last_sign_in_at: null,

                profile_completed: !!profile.profile_completed,

                target_steps: profile.target_steps || 3000

            };

        });



        res.status(200).json({ patients: transformedPatients });

    } catch (err) {

        console.error('Unexpected error in getPatients:', err);

        res.status(500).json({ error: 'Internal server error' });

    }
}