import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const NavigationContext = createContext(null);

/**
 * Parses the current window.location.pathname into an internal route state object.
 */
function parsePath(path) {
  if (!path) return { tab: 'overview' };

  if (path.startsWith('/agents/')) {
    const parts = path.split('/').filter(Boolean);
    // parts = ['agents', agentId, workflowId]
    return {
      tab: 'agent_full',
      agentId: parts[1] ? parts[1].toLowerCase() : 'research',
      workflowId: parts[2] || 'active',
    };
  }

  const clean = path.replace(/^\/+|\/+$/g, '');
  if (['workflows', 'agents', 'execution', 'recovery', 'projects'].includes(clean)) {
    return { tab: clean };
  }

  return { tab: 'overview' };
}

/**
 * Converts an internal route state object into a URL pathname.
 */
function getPathForState(state) {
  if (!state || !state.tab || state.tab === 'overview') {
    return '/';
  }
  if (state.tab === 'agent_full') {
    return `/agents/${state.agentId || 'research'}/${state.workflowId || 'active'}`;
  }
  return `/${state.tab}`;
}

export function NavigationProvider({ children }) {
  // Current active view state
  const [currentTab, setCurrentTab] = useState(() => parsePath(window.location.pathname).tab);
  const [currentAgentId, setCurrentAgentId] = useState(() => parsePath(window.location.pathname).agentId || 'research');
  const [currentWorkflowId, setCurrentWorkflowId] = useState(() => parsePath(window.location.pathname).workflowId || null);
  const [drawerAgentId, setDrawerAgentId] = useState(null);

  // In-memory stack of navigated views to support multi-level history
  const [historyStack, setHistoryStack] = useState(() => {
    const initial = parsePath(window.location.pathname);
    return [initial];
  });

  const isNavigatingRef = useRef(false);

  // Synchronize on browser popstate (Back/Forward, Alt+Left, mobile back gestures)
  useEffect(() => {
    const handlePopState = (e) => {
      const targetState = e.state || parsePath(window.location.pathname);
      setCurrentTab(targetState.tab || 'overview');
      if (targetState.agentId) setCurrentAgentId(targetState.agentId);
      if (targetState.workflowId) setCurrentWorkflowId(targetState.workflowId);

      // Pop internal history stack to match browser retreat
      setHistoryStack((prev) => {
        if (prev.length > 1) {
          return prev.slice(0, prev.length - 1);
        }
        return [targetState];
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Navigate to a tab or subpage. Pushes to history and updates URL.
   */
  const navigateTo = useCallback((tab, options = {}) => {
    const {
      agentId = tab === 'agent_full' ? currentAgentId : undefined,
      workflowId = currentWorkflowId || 'active',
      replace = false,
      subview = null,
    } = options;

    const newState = {
      tab,
      agentId: agentId ? agentId.toLowerCase() : undefined,
      workflowId,
      subview,
    };

    setCurrentTab(tab);
    if (agentId) setCurrentAgentId(agentId.toLowerCase());
    if (workflowId) setCurrentWorkflowId(workflowId);

    const url = getPathForState(newState);

    if (replace) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(newState, '', url);
      }
      setHistoryStack((prev) => {
        const next = [...prev];
        if (next.length > 0) next[next.length - 1] = newState;
        else next.push(newState);
        return next;
      });
    } else {
      if (window.history && window.history.pushState) {
        window.history.pushState(newState, '', url);
      }
      setHistoryStack((prev) => {
        const last = prev[prev.length - 1];
        // Deduplicate consecutive identical states
        if (
          last &&
          last.tab === tab &&
          last.agentId === newState.agentId &&
          last.subview === newState.subview
        ) {
          return prev;
        }
        return [...prev, newState];
      });
    }
  }, [currentAgentId, currentWorkflowId]);

  /**
   * Global Back Navigation.
   * Returns to the actual previous page.
   * If there is no usable history (e.g. refreshed or direct URL open), safely returns to fallbackTab ('overview').
   */
  const goBack = useCallback((fallbackTab = 'overview') => {
    if (historyStack.length > 1) {
      // Usable session history exists: use browser history back to maintain forward/backward symmetry
      window.history.back();
    } else {
      // No internal history (direct load or refresh) -> safely navigate to overview
      const fallbackState = { tab: fallbackTab };
      setCurrentTab(fallbackTab);
      const url = getPathForState(fallbackState);
      if (window.history && window.history.pushState) {
        window.history.pushState(fallbackState, '', url);
      }
      setHistoryStack([fallbackState]);
    }
  }, [historyStack]);

  /**
   * Human-readable title for current view
   */
  const getViewTitle = useCallback((tab, agentId) => {
    switch (tab) {
      case 'overview':
        return 'Command Center Overview';
      case 'workflows':
        return 'Workflows & DAG Runs';
      case 'agents':
        return 'Specialist Multi-Agent Swarm';
      case 'execution':
        return 'Operational DAG Execution';
      case 'recovery':
        return 'Autonomous Recovery Center';
      case 'projects':
        return 'Project Artifacts & Deliverables';
      case 'agent_full':
        return `${(agentId || 'Specialist').toUpperCase()} Agent Workstation`;
      default:
        return tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : 'Overview';
    }
  }, []);

  const canGoBack = currentTab !== 'overview' || historyStack.length > 1;
  const previousState = historyStack.length > 1 ? historyStack[historyStack.length - 2] : null;

  return (
    <NavigationContext.Provider
      value={{
        currentTab,
        currentAgentId,
        currentWorkflowId,
        drawerAgentId,
        setDrawerAgentId,
        historyStack,
        previousState,
        canGoBack,
        navigateTo,
        goBack,
        getViewTitle,
        setCurrentWorkflowId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
