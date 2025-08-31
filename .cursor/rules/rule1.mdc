# AskAtul/LightRAG WebUI Project Rules

## Project Overview
AskAtul is a React-based web interface for the LightRAG system, providing a user-friendly interface for querying, managing, and exploring LightRAG's functionalities. The project is a comprehensive RAG (Retrieval-Augmented Generation) application with multiple features including document management, knowledge graph visualization, and AI-powered querying.

## Architecture & Technology Stack

### Frontend Framework
- **React 19** with TypeScript
- **Vite** as build tool and dev server
- **React Router DOM v7** for routing
- **Tailwind CSS v4** for styling
- **Zustand** for state management

### Key Dependencies
- **UI Components**: Radix UI primitives, custom UI components
- **Graph Visualization**: Sigma.js, Graphology, React-Sigma
- **Markdown**: ReactMarkdown with Mermaid diagram support
- **Authentication**: Firebase Auth
- **Internationalization**: i18next with react-i18next
- **HTTP Client**: Axios for API calls
- **Maps**: Leaflet for geographic visualization

### Backend Integration
- **LightRAG API Server** (Python/FastAPI)
- **Base URL**: `http://localhost:9621` (configurable)
- **Authentication**: JWT-based with guest token support
- **Streaming**: NDJSON streaming API support

## Project Structure

### Core Directories
```
src/
├── api/           # API client functions
├── components/    # Reusable UI components
├── contexts/      # React contexts
├── features/      # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and constants
├── locales/       # Internationalization files
├── services/      # Service layer
├── stores/        # Zustand state stores
└── types/         # TypeScript type definitions
```

### Key Features
1. **Retrieval System**: Multiple query modes (naive, local, global, hybrid, mix, bypass)
2. **Document Management**: Upload, scan, and manage documents
3. **Knowledge Graph**: Visualize and interact with knowledge graphs
4. **Form Builder**: Dynamic form creation and management
5. **Authentication**: Firebase-based auth with role-based access
6. **Multi-language Support**: English, Chinese, French, Arabic, Traditional Chinese

## State Management Rules

### Zustand Stores
- **`useAuthStore`**: Authentication state, user info, plan/role
- **`useSettingsStore`**: Application settings, query parameters, theme
- **`useBackendState`**: Backend health, status, pipeline state
- **`useGraphStore`**: Graph visualization state
- **`useNavigationTabsStore`**: Navigation tab configuration

### State Persistence
- Settings stored in localStorage with version migration
- Authentication tokens persisted across sessions
- Query history maintained in local storage

## API Integration Rules

### LightRAG API Client (`src/api/lightrag.ts`)
- **Base Configuration**: Uses `backendBaseUrl` from constants
- **Authentication**: Automatic token inclusion in headers
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Streaming Support**: NDJSON streaming with chunk parsing

### Query Modes
- **naive**: Basic search without advanced techniques
- **local**: Context-dependent information focus
- **global**: Global knowledge utilization
- **hybrid**: Combines local and global methods
- **mix**: Integrates knowledge graph and vector retrieval
- **bypass**: Direct LLM usage without retrieval

### Streaming API
- **Format**: NDJSON with `{"response": "chunk"}` structure
- **Chunk Processing**: Automatic JSON parsing and response extraction
- **Error Handling**: Graceful fallback for malformed chunks

## Component Architecture Rules

### Retrieval Components
- **`RetrievalTestingFree*`**: Multiple retrieval testing pages with different backend URLs
- **`QuerySettings`**: Configurable query parameters
- **`ChatMessage`**: Message display with markdown, syntax highlighting, and Mermaid support

### Message Display
- **Markdown Rendering**: Full markdown support with GFM and math
- **Code Highlighting**: Syntax highlighting for multiple languages
- **Mermaid Diagrams**: Automatic diagram rendering with debouncing
- **Large JSON Handling**: Special handling for large JSON blocks

### Form System
- **Dynamic Forms**: JSON Schema-based form generation
- **Form Builder**: Tree-based form organization
- **Preview System**: Real-time form preview

## Routing & Navigation Rules

### Route Structure
- **Base Path**: `/AskAtul/` (configurable in vite.config.ts)
- **Public Routes**: `/retrieval*`, `/map*`, `/forms*`
- **Protected Routes**: `/access/*` (requires pro plan)
- **Admin Routes**: `/temp-admin`, `/dynamic-admin`

### Navigation Tabs
- **Dynamic Configuration**: Firebase-based tab configuration
- **Role-based Access**: Different tabs for different user roles
- **Backend URL Mapping**: Each tab can have different backend URLs

## Authentication & Authorization Rules

### Firebase Integration
- **Auth State**: Automatic auth state management
- **Token Handling**: JWT token storage and automatic inclusion
- **Guest Mode**: Fallback authentication for local development
- **Role-based Access**: Plan-based feature access control

### Guest Token System
- **Local Backend**: Automatic guest token retrieval from `/auth-status`
- **Token Validation**: Automatic token validation and refresh
- **Fallback Handling**: Graceful degradation for unauthenticated users

## Development & Build Rules

### Development Server
- **Port**: 5173 (configurable)
- **Base Path**: `/AskAtul/`
- **Hot Reload**: Vite-based development server
- **Proxy Configuration**: Configurable API proxying

### Build Configuration
- **Output Directory**: `dist/` (configurable)
- **Chunk Splitting**: Manual chunk optimization for vendor libraries
- **Asset Optimization**: Optimized asset naming and organization

## Error Handling Rules

### API Errors
- **HTTP Status Codes**: Specific handling for 401, 403, 404, 429, 5xx
- **Network Errors**: Graceful handling of connection issues
- **Authentication Errors**: Automatic redirect to login
- **Streaming Errors**: Chunk-level error handling

### User Experience
- **Loading States**: Comprehensive loading indicators
- **Error Messages**: User-friendly error messages
- **Fallback UI**: Graceful degradation for failed features

## Performance Rules

### Code Splitting
- **Vendor Chunks**: Separate chunks for major libraries
- **Feature Chunks**: Individual chunks for major features
- **Lazy Loading**: Dynamic imports for heavy components

### Rendering Optimization
- **Memoization**: Strategic use of React.memo and useMemo
- **Debouncing**: Input and API call debouncing
- **Virtual Scrolling**: For large lists and graphs

## Internationalization Rules

### Language Support
- **Primary**: English (en)
- **Secondary**: Chinese (zh), French (fr), Arabic (ar), Traditional Chinese (zh_TW)
- **Dynamic Loading**: Language switching without page reload

### Translation Keys
- **Namespaced**: Organized by feature (retrievePanel, chat, etc.)
- **Contextual**: Tooltips and help text included
- **Fallbacks**: Graceful fallback to English

## Testing & Quality Rules

### Code Quality
- **ESLint**: Strict linting rules with TypeScript support
- **TypeScript**: Strict type checking enabled
- **Prettier**: Consistent code formatting

### Component Testing
- **Error Boundaries**: Comprehensive error boundary implementation
- **Loading States**: Consistent loading state handling
- **Accessibility**: ARIA labels and keyboard navigation support

## Deployment Rules

### Environment Configuration
- **Development**: Local backend (`localhost:9621`)
- **Production**: Configurable backend URLs
- **Environment Variables**: Vite-based environment configuration

### Build Optimization
- **Bundle Analysis**: Manual chunk optimization
- **Asset Optimization**: Optimized asset delivery
- **CDN Ready**: Static asset optimization for CDN deployment

## Security Rules

### API Security
- **Token Storage**: Secure token storage in localStorage
- **CORS Handling**: Proper CORS configuration
- **Input Validation**: Client-side input validation
- **XSS Prevention**: Markdown sanitization and safe rendering

### Authentication Security
- **Token Validation**: Automatic token validation
- **Session Management**: Secure session handling
- **Role Verification**: Server-side role verification

## Maintenance Rules

### Code Organization
- **Feature-based Structure**: Components organized by feature
- **Shared Components**: Reusable components in shared directories
- **Type Definitions**: Centralized type definitions
- **Utility Functions**: Common utilities in lib directory

### Version Management
- **State Migration**: Automatic state schema migration
- **Backward Compatibility**: Maintain backward compatibility
- **Feature Flags**: Configurable feature enablement

## Troubleshooting Rules

### Common Issues
- **Backend Connection**: Check backend health and URL configuration
- **Authentication**: Verify token validity and guest token availability
- **Streaming Issues**: Check NDJSON format and chunk parsing
- **Build Issues**: Verify Vite configuration and dependencies

### Debug Tools
- **Console Logging**: Comprehensive logging for debugging
- **Network Tab**: Monitor API calls and responses
- **State Inspection**: Zustand dev tools for state debugging
- **Error Boundaries**: Component-level error tracking

## Future Development Rules

### Feature Additions
- **Modular Architecture**: Easy addition of new features
- **Plugin System**: Extensible component system
- **API Extensions**: Backend API compatibility
- **Performance Monitoring**: Built-in performance tracking

### Scalability
- **Component Reusability**: Maximize component reuse
- **State Optimization**: Efficient state management
- **Bundle Optimization**: Continuous bundle size optimization
- **Caching Strategy**: Implement intelligent caching

---

# 🧠 MEMORY BANK - Project Knowledge Repository

## 📚 **Core Knowledge Patterns**

### **1. Authentication Flow Pattern**
```typescript
// Standard authentication pattern used throughout the app
const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const status = await getAuthStatus();
    const token = status.access_token || '';
    login(token, status.core_version, status.api_version, ...);
  } else {
    logout();
    setIsGuestMode(true);
  }
});
```

### **2. API Request Pattern**
```typescript
// Standard API request with automatic token handling
const response = await axiosInstance.post('/endpoint', data);
// Token automatically included via interceptor
// Error handling via response interceptor
```

### **3. Streaming Response Pattern**
```typescript
// NDJSON streaming with automatic chunk parsing
await queryFreeTextStream(loginUrl, queryParams, (chunk) => {
  try {
    const chunkData = JSON.parse(chunk);
    if (chunkData.response) {
      fullAnswer += chunkData.response;
      updateAssistantMessage(chunkData.response);
    }
  } catch (parseError) {
    console.warn('Failed to parse chunk:', chunk);
  }
});
```

### **4. Zustand Store Pattern**
```typescript
// Standard Zustand store structure
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // State
      data: [],
      // Actions
      setData: (data) => set({ data }),
      // Computed
      getDataCount: () => get().data.length,
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (state, version) => { /* migration logic */ }
    }
  )
);
```

## 🔧 **Common Utility Functions**

### **1. Error Message Handling**
```typescript
// Standard error message extraction
export const errorMessage = (error: any): string => {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};
```

### **2. Unique ID Generation**
```typescript
// Standard unique ID generation for React keys
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
```

### **3. Debounced Input Handling**
```typescript
// Standard debounced input pattern
const debouncedValue = useDebounce(inputValue, 300);
useEffect(() => {
  // Handle debounced value changes
}, [debouncedValue]);
```

## 🎯 **Component Patterns**

### **1. Message Component Pattern**
```typescript
// Standard message display component
export const ChatMessage = ({ message }: { message: MessageWithError }) => {
  const { theme } = useTheme();
  const [katexPlugin, setKatexPlugin] = useState<any>(null);
  
  // Dynamic KaTeX loading
  useEffect(() => {
    const loadKaTeX = async () => {
      const [{ default: rehypeKatex }] = await Promise.all([
        import('rehype-katex'),
        import('katex/dist/katex.min.css')
      ]);
      setKatexPlugin(() => rehypeKatex);
    };
    loadKaTeX();
  }, []);
  
  return (
    <div className={`${message.role === 'user' ? 'user-styles' : 'assistant-styles'}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} {...props} />
    </div>
  );
};
```

### **2. Settings Component Pattern**
```typescript
// Standard settings component structure
export default function SettingsComponent() {
  const settings = useSettingsStore((state) => state.settings);
  
  const handleChange = useCallback((key: string, value: any) => {
    useSettingsStore.getState().updateSettings({ [key]: value });
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Settings controls */}
      </CardContent>
    </Card>
  );
}
```

### **3. Form Component Pattern**
```typescript
// Standard form component with controlled inputs
export default function FormComponent() {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic
  }, [formData]);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## 🌐 **API Endpoint Patterns**

### **1. Health Check Endpoint**
```typescript
// Standard health check pattern
export const checkHealth = async (): Promise<LightragStatus | { status: 'error'; message: string }> => {
  try {
    const response = await axiosInstance.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: errorMessage(error)
    };
  }
};
```

### **2. Document Management Endpoints**
```typescript
// Standard document operation patterns
export const uploadDocument = async (file: File, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? (e) => {
      const percent = Math.round((e.loaded * 100) / e.total!);
      onProgress(percent);
    } : undefined
  });
  
  return response.data;
};
```

### **3. Query Endpoints**
```typescript
// Standard query pattern with streaming support
export const queryTextStream = async (
  backendUrl: string,
  request: QueryRequest,
  onChunk: (chunk: string) => void,
  onError?: (error: string) => void
) => {
  const response = await fetch(`${backendUrl}/query/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/x-ndjson' },
    body: JSON.stringify(request)
  });
  
  // Stream processing logic
};
```

## 🎨 **UI Component Patterns**

### **1. Card Component Pattern**
```typescript
// Standard card component structure
<Card className="flex shrink-0 flex-col min-w-[220px]">
  <CardHeader className="px-4 pt-4 pb-2">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="m-0 flex grow flex-col p-0">
    {/* Content */}
  </CardContent>
</Card>
```

### **2. Tooltip Pattern**
```typescript
// Standard tooltip implementation
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <label className="cursor-help">Label</label>
    </TooltipTrigger>
    <TooltipContent side="left">
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### **3. Select Component Pattern**
```typescript
// Standard select component
<Select value={value} onValueChange={(v) => handleChange(key, v)}>
  <SelectTrigger className="h-9 cursor-pointer">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectItem value="option1">Option 1</SelectItem>
      <SelectItem value="option2">Option 2</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

## 🔄 **State Management Patterns**

### **1. Store Selector Pattern**
```typescript
// Standard store selector usage
const querySettings = useSettingsStore((state) => state.querySettings);
const updateSettings = useSettingsStore((state) => state.updateQuerySettings);

// Or use createSelectors for multiple selectors
export const useSettingsStore = createSelectors(useSettingsStoreBase);
```

### **2. State Migration Pattern**
```typescript
// Standard state migration in Zustand persist
migrate: (state: any, version: number) => {
  if (version < 2) {
    state.newField = defaultValue;
  }
  if (version < 3) {
    state.anotherField = anotherDefault;
  }
  return state;
}
```

### **3. Action Pattern**
```typescript
// Standard action pattern in stores
setData: (data: DataType[]) => set({ data }),
updateData: (id: string, updates: Partial<DataType>) => 
  set((state) => ({
    data: state.data.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
```

## 🚀 **Performance Patterns**

### **1. Memoization Pattern**
```typescript
// Standard memoization for expensive computations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Component memoization
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{/* component content */}</div>;
});
```

### **2. Debouncing Pattern**
```typescript
// Standard debouncing hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### **3. Lazy Loading Pattern**
```typescript
// Standard lazy loading for heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Usage with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

## 🛠️ **Development Patterns**

### **1. Environment Configuration**
```typescript
// Standard environment variable handling
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9621';
const isDev = import.meta.env.DEV;
const basePath = import.meta.env.VITE_BASE_PATH || '/AskAtul/';
```

### **2. Type Definition Pattern**
```typescript
// Standard type definition structure
export type ComponentProps = {
  // Required props
  required: string;
  // Optional props with defaults
  optional?: number;
  // Union types
  variant: 'primary' | 'secondary' | 'danger';
  // Function props
  onAction: (data: ActionData) => void;
  // Generic types
  items: Array<ItemType>;
};

// Interface for complex objects
export interface ComplexObject {
  id: string;
  name: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### **3. Error Boundary Pattern**
```typescript
// Standard error boundary implementation
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}
```

## 📱 **Responsive Design Patterns**

### **1. Tailwind CSS Responsive Classes**
```typescript
// Standard responsive class patterns
className="
  w-full                    // Mobile first
  md:w-auto                // Medium screens and up
  lg:w-64                  // Large screens and up
  xl:w-80                  // Extra large screens and up
"
```

### **2. Conditional Rendering Pattern**
```typescript
// Standard conditional rendering based on screen size
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// Usage
{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

## 🔍 **Debugging Patterns**

### **1. Console Logging Pattern**
```typescript
// Standard debugging log pattern
console.log('Component state:', { 
  prop1, 
  prop2, 
  computedValue: expensiveCalculation(prop1) 
});

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

### **2. Network Debug Pattern**
```typescript
// Standard network debugging
const response = await fetch(url, options);
console.log('Response status:', response.status);
console.log('Response headers:', Object.fromEntries(response.headers.entries()));
const data = await response.json();
console.log('Response data:', data);
```

## 🎯 **Common Use Cases & Solutions**

### **1. Handling Loading States**
```typescript
// Standard loading state pattern
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState(null);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const result = await apiCall();
    setData(result);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    setIsLoading(false);
  }
};

// Usage in JSX
{isLoading ? <LoadingSpinner /> : <DataDisplay data={data} />}
```

### **2. Form Validation Pattern**
```typescript
// Standard form validation pattern
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name) newErrors.name = 'Name is required';
  if (!formData.email) newErrors.email = 'Email is required';
  if (formData.email && !isValidEmail(formData.email)) {
    newErrors.email = 'Invalid email format';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (validateForm()) {
    // Submit form
  }
};
```

### **3. Pagination Pattern**
```typescript
// Standard pagination pattern
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalItems, setTotalItems] = useState(0);

const totalPages = Math.ceil(totalItems / pageSize);
const startIndex = (currentPage - 1) * pageSize;
const endIndex = startIndex + pageSize;

const handlePageChange = (page: number) => {
  setCurrentPage(page);
  // Fetch data for new page
};
```

This comprehensive memory bank ensures consistent development practices, maintainable code, and a robust user experience across the AskAtul/LightRAG WebUI application.
description: "check each file for syntex error everytime a task is completed."
globs: true
alwaysApply: true
---
