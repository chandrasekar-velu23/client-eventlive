import { useState, useCallback } from "react";
import { getUserProfile, updateUserProfile } from "../services/api";

/**
 * Custom hook for managing user profile data
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState<{ id: string; name: string; email: string; bio: string; avatar: string; socialLinks: Record<string, string>; organizationName?: string; eventTypes?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile information
   */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserProfile();
      setProfile(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile information
   */
  const updateProfile = useCallback(async (data: Partial<{ name: string; bio: string; avatar: string; socialLinks: Record<string, string>; organizationName: string; eventTypes: string[] }>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateUserProfile(data);
      setProfile(response || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
};
