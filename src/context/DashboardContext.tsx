'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from 'react';
import {
  DashboardState,
  DashboardAction,
  OverlayKey,
  Asset,
  TimeRange,
} from '@/lib/types';
import { DEFAULT_OVERLAYS } from '@/lib/constants';

const initialState: DashboardState = {
  asset: 'BTC',
  comparisonAsset: null,
  timeRange: '1Y',
  overlays: { ...DEFAULT_OVERLAYS },
};

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_ASSET':
      return { ...state, asset: action.payload };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'TOGGLE_OVERLAY':
      return {
        ...state,
        overlays: {
          ...state.overlays,
          [action.payload]: !state.overlays[action.payload],
        },
      };
    case 'TOGGLE_COMPARISON':
      return {
        ...state,
        comparisonAsset: state.comparisonAsset
          ? null
          : state.asset === 'BTC'
            ? 'ETH'
            : 'BTC',
        overlays: {
          ...state.overlays,
          btcEthComparison: !state.overlays.btcEthComparison,
        },
      };
    default:
      return state;
  }
}

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  setAsset: (asset: Asset) => void;
  setTimeRange: (range: TimeRange) => void;
  toggleOverlay: (key: OverlayKey) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setAsset = (asset: Asset) => dispatch({ type: 'SET_ASSET', payload: asset });
  const setTimeRange = (range: TimeRange) =>
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  const toggleOverlay = (key: OverlayKey) =>
    dispatch({ type: 'TOGGLE_OVERLAY', payload: key });

  return (
    <DashboardContext.Provider
      value={{ state, dispatch, setAsset, setTimeRange, toggleOverlay }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
