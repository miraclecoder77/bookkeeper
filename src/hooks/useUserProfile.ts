import { useState, useCallback, useEffect } from 'react';
import { UserProfile } from '../types';
import * as dal from '../services/dal';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const res = await dal.profile.get();
    if (res.ok && res.data) {
      setProfile(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const res = await dal.profile.update(patch);
    if (res.ok && res.data) {
      setProfile(res.data);
    }
    return res;
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    reloadProfile: loadProfile,
  };
};
