import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Client } from '../../core/domain/entities/Client';

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

type ClientsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'SET_ERROR'; payload: string };

const clientsReducer = (state: ClientsState, action: ClientsAction): ClientsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload, loading: false, error: null };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState: ClientsState = {
  clients: [],
  loading: false,
  error: null,
};

const ClientsContext = createContext<{
  state: ClientsState;
  dispatch: React.Dispatch<ClientsAction>;
} | null>(null);

export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(clientsReducer, initialState);

  return (
    <ClientsContext.Provider value={{ state, dispatch }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) throw new Error('useClients must be used within ClientsProvider');
  return context;
};
