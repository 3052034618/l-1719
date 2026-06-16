
import { create } from 'zustand';
import type { DashboardStats, Vehicle, Booking, VehicleLocation } from '@shared/types';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  stats: DashboardStats | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
  vehicles: Vehicle[];
  fetchVehicles: () => Promise<void>;
  vehicleLocations: VehicleLocation[];
  fetchVehicleLocations: () => Promise<void>;
  bookings: Booking[];
  fetchBookings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  stats: null,
  loading: false,
  vehicles: [],
  vehicleLocations: [],
  bookings: [],

  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      set({ stats: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchVehicles: async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      set({ vehicles: Array.isArray(data) ? data : data.data || [] });
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  },

  fetchVehicleLocations: async () => {
    try {
      const res = await fetch('/api/vehicles/locations');
      const data = await res.json();
      set({ vehicleLocations: data });
    } catch (error) {
      console.error('Failed to fetch vehicle locations:', error);
    }
  },

  fetchBookings: async () => {
    try {
      const res = await fetch('/api/bookings?pageSize=50');
      const data = await res.json();
      set({ bookings: data.data || [] });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  },
}));
