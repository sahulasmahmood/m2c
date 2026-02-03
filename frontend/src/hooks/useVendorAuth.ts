import { useState, useEffect } from 'react';
import VendorService, { VendorProfile, VendorLoginResponse } from '../services/vendorService';

export const useVendorAuth = () => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (VendorService.isLoggedIn()) {
          const storedVendor = VendorService.getStoredVendorData();
          if (storedVendor) {
            // Verify token is still valid by fetching profile
            const profile = await VendorService.getVendorProfile();
            setVendor(profile.vendor);
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        VendorService.logout();
        const errorMessage = error?.message || (error instanceof Error ? error.message : 'Authentication failed')
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<VendorLoginResponse> => {
    try {
      setLoading(true);
      setError(null);
      const result = await VendorService.loginVendor(email, password);
      // Fetch full profile after successful login
      const profile = await VendorService.getVendorProfile();
      setVendor(profile.vendor);
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || (error instanceof Error ? error.message : 'Login failed')
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    VendorService.logout();
    setVendor(null);
    setError(null);
  };
  
  const updateProfile = async (updateData: Partial<VendorProfile>) => {
    try {
      const result = await VendorService.updateVendorProfile(updateData);
      setVendor(result.vendor);
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || (error instanceof Error ? error.message : 'Update failed')
      setError(errorMessage);
      throw error;
    }
  };
  
  return {
    vendor,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isLoggedIn: !!vendor
  };
};