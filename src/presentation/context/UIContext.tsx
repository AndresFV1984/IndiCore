import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface UIState {
  sidebarOpen: boolean;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  modals: { [key: string]: boolean };
}

type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL'; payload: string };

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'ADD_TOAST':
      const id = Date.now().toString();
      return { ...state, toasts: [...state.toasts, { id, ...action.payload }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'OPEN_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: true } };
    case 'CLOSE_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: false } };
    default:
      return state;
  }
};

const initialState: UIState = {
  sidebarOpen: true,
  toasts: [],
  modals: {},
};

const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | null>(null);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
