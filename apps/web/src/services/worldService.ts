import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';
import type {
  WorldStateSnapshot,
  CellTowerSnapshot,
  SignalSnapshot,
  GpsStateSnapshot,
  VpnStateSnapshot,
  CarrierStateSnapshot,
  NetworkStateSnapshot,
  DeviceLocationState,
} from '@/types';


export const worldService = {
  async getWorldState(): Promise<WorldStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: WorldStateSnapshot }>('/api/world/state', { token });
    return res.data!;
  },

  async tickWorld(): Promise<unknown> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: unknown }>('/api/world/tick', { method: 'POST', token });
    return res.data;
  },

  async searchLocations(q: string): Promise<Array<Record<string, unknown>>> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Array<Record<string, unknown>> }>(
      `/api/world/locations/search?q=${encodeURIComponent(q)}`,
      { token }
    );
    return res.data ?? [];
  },

  async getNearbyTowers(): Promise<CellTowerSnapshot[]> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: CellTowerSnapshot[] }>('/api/world/towers/nearby', { token });
    return res.data ?? [];
  },

  async getGps(): Promise<GpsStateSnapshot & { currentPosition?: DeviceLocationState }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: GpsStateSnapshot & { currentPosition?: DeviceLocationState } }>(
      '/api/world/gps',
      { token }
    );
    return res.data!;
  },

  async startNavigation(destination: { locationId?: string; name?: string; lat?: number; lng?: number }): Promise<GpsStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: GpsStateSnapshot }>(
      '/api/world/gps/navigate',
      { method: 'POST', body: JSON.stringify(destination), token }
    );
    return res.data!;
  },

  async stopNavigation(): Promise<GpsStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: GpsStateSnapshot }>(
      '/api/world/gps/stop',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getCarrier(): Promise<CarrierStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: CarrierStateSnapshot }>('/api/world/carrier', { token });
    return res.data!;
  },

  async getNetwork(): Promise<NetworkStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: NetworkStateSnapshot }>('/api/world/network', { token });
    return res.data!;
  },

  async getVpn(): Promise<VpnStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: VpnStateSnapshot }>('/api/world/vpn', { token });
    return res.data!;
  },

  async connectVpn(countryCode: string): Promise<VpnStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: VpnStateSnapshot }>(
      '/api/world/vpn/connect',
      { method: 'POST', body: JSON.stringify({ countryCode }), token }
    );
    return res.data!;
  },

  async disconnectVpn(): Promise<VpnStateSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: VpnStateSnapshot }>(
      '/api/world/vpn/disconnect',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getVpnCountries(): Promise<Array<{ code: string; name: string }>> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Array<{ code: string; name: string }> }>(
      '/api/world/vpn/countries',
      { token }
    );
    return res.data ?? [];
  },

  async getLocationHistory(limit = 50): Promise<Array<Record<string, unknown>>> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Array<Record<string, unknown>> }>(
      `/api/world/gps/history?limit=${limit}`,
      { token }
    );
    return res.data ?? [];
  },
};

export type { SignalSnapshot };
