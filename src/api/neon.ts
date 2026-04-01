import axios from 'axios';

// Interface for claimant data
export interface ClaimantData {
  claimant_number: string;
  claimant_name: string;
  claimant_type: string;
  claimant_address: string;
  claimant_phone?: string;
  claim_received?: string;
  claim_admitted?: string;
  payment_sr_no: string;
  payment_amount: string;
  bank_from: string;
  bank_to: string;
  account_number: string;
  date_transfer: string;
}

// Get the backend base URL from environment or constants
const getBackendUrl = () => {
  return import.meta.env.VITE_NEON_BACKEND_URL || 'https://resolutionbazaar.com:9621';
};

/**
 * Search for claimant data by claimant number
 * @param claimantNumber - The claimant number to search for
 * @returns Promise<ClaimantData[]> - Array of claimant data with payments
 */
export const searchClaimant = async (claimantNumber: string): Promise<ClaimantData[]> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await axios.get(`${backendUrl}/api/claimant/${claimantNumber}`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching claimant data:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check if the backend server is running.');
      } else {
        // Something else happened
        throw new Error(`Request error: ${error.message}`);
      }
    }
    
    throw new Error('Unknown error occurred while fetching claimant data');
  }
};

/**
 * Test the connection to the backend server
 * @returns Promise<boolean> - True if connection is successful
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await axios.get(`${backendUrl}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return false;
  }
};
