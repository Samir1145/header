import { ButtonVariantType } from '@/components/ui/Button'


export const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'https://resolutionbazaar.com:9621'
export const backendFreeBaseUrl = import.meta.env.VITE_BACKEND_URL || 'https://resolutionbazaar.com:9621'
export const backendFreeBaseUrl2 = import.meta.env.VITE_BACKEND_URL_2 || 'https://resolutionbazaar.com:9622'
export const backendFreeBaseUrl3 = import.meta.env.VITE_BACKEND_URL_3 || 'https://resolutionbazaar.com:9623'
export const backendFreeBaseUrl4 = import.meta.env.VITE_BACKEND_URL_4 || 'https://resolutionbazaar.com:9624'
export const backendFreeBaseUrl5 = import.meta.env.VITE_BACKEND_URL_5 || 'https://resolutionbazaar.com:9625'
export const backendFreeBaseUrl6 = import.meta.env.VITE_BACKEND_URL_6 || 'https://resolutionbazaar.com:9626'


// Server token configuration interface
export interface ServerConfig {
  url: string
  token: string
  name: string
}

// Function to get server configurations from environment variables
export const getServerConfigs = (): ServerConfig[] => {
  const configs: ServerConfig[] = []
  
  // Check for up to 6 servers (can be extended)
  for (let i = 1; i <= 6; i++) {
    const url = import.meta.env[`VITE_SERVER_${i}_URL`]
    const token = import.meta.env[`VITE_SERVER_${i}_TOKEN`]
    
    if (url && token) {
      configs.push({
        url,
        token,
        name: `Server ${i}`
      })
    }
  }
  
  return configs
}

// Get all available server configurations
export const serverConfigs = getServerConfigs()


// Function to get token for a specific server URL
export const getTokenForServer = async (serverUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(`${serverUrl}/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: import.meta.env.VITE_AUTH_USERNAME || '',
        password: import.meta.env.VITE_AUTH_PASSWORD || '',
        scope: import.meta.env.VITE_AUTH_SCOPE || '',
        client_id: import.meta.env.VITE_AUTH_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_AUTH_CLIENT_SECRET || ''
      }).toString()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch auth status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // Try to get access_token from response
    if (data && typeof data.access_token === 'string') {
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error fetching access token from auth status:', error);
    return null;
  }
};

// Function to get server URL by index
export const getServerUrl = (index: number): string | null => {
  const config = serverConfigs[index - 1] // Convert to 0-based index
  return config?.url || null
}

// Array of all available server URLs for easy iteration
export const availableServers = serverConfigs.map(config => config.url)
export const webuiPrefix = '/webui/'

export const controlButtonVariant: ButtonVariantType = 'ghost'

export const labelColorDarkTheme = '#B2EBF2'
export const LabelColorHighlightedDarkTheme = '#000'

export const nodeColorDisabled = '#E2E2E2'
export const nodeBorderColor = '#EEEEEE'
export const nodeBorderColorSelected = '#F57F17'

export const edgeColorDarkTheme = '#969696'
export const edgeColorSelected = '#F57F17'
export const edgeColorHighlighted = '#B2EBF2'

export const searchResultLimit = 50
export const labelListLimit = 100

export const minNodeSize = 4
export const maxNodeSize = 20

export const healthCheckInterval = 15 // seconds

export const defaultQueryLabel = '*'

// reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types
export const supportedFileTypes = {
  'text/plain': [
    '.txt',
    '.md',
    '.html',
    '.htm',
    '.tex',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.rtf',
    '.odt',
    '.epub',
    '.csv',
    '.log',
    '.conf',
    '.ini',
    '.properties',
    '.sql',
    '.bat',
    '.sh',
    '.c',
    '.cpp',
    '.py',
    '.java',
    '.js',
    '.ts',
    '.swift',
    '.go',
    '.rb',
    '.php',
    '.css',
    '.scss',
    '.less'
  ],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
}

export const SiteInfo = {
  name: 'AskAtul',
  home: '/',
  // github: 'https://github.com/HKUDS/LightRAG'
}
