import { NavigateFunction } from 'react-router-dom';
import { useBackendState } from '@/stores/state';
import { useGraphStore } from '@/stores/graph';
import { useSettingsStore } from '@/stores/settings';
import { sqliteLogout } from '@/api/sqliteAuth';

class NavigationService {
  private navigate: NavigateFunction | null = null;

  setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  /**
   * Reset all application state to ensure a clean environment.
   * This function should be called when:
   * 1. User logs out
   * 2. Authentication token expires
   * 3. Direct access to login page
   *
   * @param preserveHistory If true, chat history will be preserved. Default is false.
   */
  resetAllApplicationState(preserveHistory = false) {
    console.log('Resetting all application state...');

    // Reset graph state
    const graphStore = useGraphStore.getState();
    const sigma = graphStore.sigmaInstance;
    graphStore.reset();
    graphStore.setGraphDataFetchAttempted(false);
    graphStore.setLabelsFetchAttempted(false);
    graphStore.setSigmaInstance(null);
    graphStore.setIsFetching(false);

    // Reset backend state
    useBackendState.getState().clear();

    // Reset retrieval history message only if preserveHistory is false
    if (!preserveHistory) {
      useSettingsStore.getState().setRetrievalHistory([]);
    }

    // Clear authentication state
    sessionStorage.clear();

    // Clear graph if exists
    if (sigma) {
      sigma.getGraph().clear();
      sigma.kill();
      graphStore.setSigmaInstance(null);
    }
  }

  /**
   * Navigate to login page and reset application state
   */
  async navigateToLogin() {
    if (!this.navigate) {
      console.error('Navigation function not set');
      return;
    }

    // Store previous user email if available
    const token = localStorage.getItem('LIGHTRAG-API-TOKEN');
    if (token) {
      try {
        // Try to extract email from JWT payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          localStorage.setItem('LIGHTRAG-PREVIOUS-USER', payload.email);
        }
      } catch (e) {
        // Ignore JWT parsing errors
      }
    }

    // Reset application state but preserve chat history
    this.resetAllApplicationState(true);

    // Logout from SQLite backend
    await sqliteLogout();

    // Navigate to login
    this.navigate('/retrieval');
  }

  navigateToHome() {
    if (!this.navigate) {
      console.error('Navigation function not set');
      return;
    }

    this.navigate('/');
  }
}

export const navigationService = new NavigationService();
