'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfessionalJobSubscription({ user }) {
  const [jobs, setJobs] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    loadJobs();

    // Subscribe to job updates
    const jobsSubscription = supabase
      .channel('pro-jobs-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        (payload) => {
          console.log('Job update received:', payload);
          loadJobs(); // Reload jobs when there's an update
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `professional_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bid update received:', payload);
          loadJobs(); // Reload jobs when there's a bid update
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [user?.id]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!fk_customer (
            full_name,
            email,
            phone,
            location,
            avatar_url,
            created_at
          ),
          bids (
            id,
            amount,
            message,
            status,
            professional_id,
            created_at,
            professional:profiles!professional_id (
              full_name,
              avatar_url,
              professional_profile:professional_profiles (
                business_name,
                business_description,
                service_area,
                logo_url
              )
            )
          ),
          job_photos (
            id,
            photo_url
          ),
          time_suggestions (
            id,
            suggested_date,
            suggested_time,
            message,
            status,
            professional_id,
            created_at,
            updated_at
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviewer_id (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Split jobs into available jobs and jobs with my bids
      const jobsWithMyBids = data?.filter(job => 
        job.bids?.some(bid => bid.professional_id === user.id)
      ) || [];
      
      const availableJobs = data?.filter(job => 
        job.status === 'open' && 
        !job.bids?.some(bid => bid.professional_id === user.id)
      ) || [];
      
      setMyBids(jobsWithMyBids);
      setJobs(availableJobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    myBids,
    loading,
    error,
    loadJobs
  };
} 