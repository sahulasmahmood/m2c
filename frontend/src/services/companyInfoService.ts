import axios from '@/lib/axios';

export interface CompanyInfo {
  id: string;
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  registeredAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankBranch?: string;
  updatedAt: string;
}

export interface UpdateBasicInfoData {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
}

export interface UpdateLegalInfoData {
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
}

export interface UpdateAddressData {
  registeredAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface UpdateBankDetailsData {
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankBranch?: string;
}

const LOGO_CACHE_KEY = 'companyInfo_public';
const DEFAULT_INFO = { companyName: 'M2C MarkDowns Private Limited', companyLogo: null };

export const companyInfoService = {
  // Get cached company info instantly (no API call — for initial render)
  getCachedCompanyInfo: (): { companyName: string; companyLogo: string | null } => {
    try {
      const cached = localStorage.getItem(LOGO_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return DEFAULT_INFO;
  },

  // Get public company info with localStorage caching (no auth required)
  getPublicCompanyInfo: async (): Promise<{ companyName: string; companyLogo: string | null }> => {
    try {
      const response = await axios.get('/company-info/public');
      const data = response.data?.data || DEFAULT_INFO;
      try { localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      return data;
    } catch {
      return companyInfoService.getCachedCompanyInfo();
    }
  },

  // Get company info
  getCompanyInfo: async () => {
    try {
      const response = await axios.get('/company-info');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch company info');
    }
  },

  // Update basic information
  updateBasicInfo: async (data: UpdateBasicInfoData) => {
    try {
      const response = await axios.put('/company-info/basic', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update basic information');
    }
  },

  // Update legal information
  updateLegalInfo: async (data: UpdateLegalInfoData) => {
    try {
      const response = await axios.put('/company-info/legal', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update legal information');
    }
  },

  // Update address
  updateAddress: async (data: UpdateAddressData) => {
    try {
      const response = await axios.put('/company-info/address', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update address');
    }
  },

  // Update bank details
  updateBankDetails: async (data: UpdateBankDetailsData) => {
    try {
      const response = await axios.put('/company-info/bank', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update bank details');
    }
  },

  // Update company logo
  updateLogo: async (companyLogo: string) => {
    try {
      const response = await axios.put('/company-info/logo', { companyLogo });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update company logo');
    }
  }
};
