'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { realtimeService } from '@/services/realtimeService';
import { businessService } from '@/services/businessService';

export function useBusinessInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCompanies = useBusinessStore((s) => s.setCompanies);
  const setPermissions = useBusinessStore((s) => s.setPermissions);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    businessService.initialize(token)
      .then((data) => {
        const init = data as { companies?: Record<string, unknown>[]; permissions?: string[] };
        if (init.companies) {
          setCompanies(init.companies.map((c) => ({
            companyId: String(c.companyId),
            name: String(c.name),
            tradeName: String(c.tradeName),
            category: String(c.category),
            status: String(c.status),
            availableBalance: Number(c.availableBalance ?? 0),
            netProfit: Number(c.netProfit ?? 0),
            employeeCount: Number(c.employeeCount ?? 0),
            customerCount: Number(c.customerCount ?? 0),
          })));
        }
        if (init.permissions) setPermissions(init.permissions);
      })
      .catch(() => {});
  }, [isAuthenticated, token, setCompanies, setPermissions]);
}

export function useBusinessSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'business:initialized', 'business:company:update', 'business:revenue:update',
      'business:expense:update', 'business:payroll:update', 'business:inventory:update',
      'business:employee:update', 'business:report:ready', 'business:notification',
      'business:bank:transaction', 'business:status:change', 'business:analytics:update',
      'business:invoice:update', 'business:contract:update', 'business:government:alert',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['business'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useBusinessCompanies() {
  const token = useAuthStore((s) => s.getAccessToken());
  const setCompanies = useBusinessStore((s) => s.setCompanies);
  return useQuery({
    queryKey: ['business', 'companies'],
    queryFn: async () => {
      const data = await businessService.getCompanies(token!);
      setCompanies(data.map((c) => ({
        companyId: String(c.companyId),
        name: String(c.name),
        tradeName: String(c.tradeName),
        category: String(c.category),
        status: String(c.status),
        availableBalance: Number(c.availableBalance ?? 0),
        netProfit: Number(c.netProfit ?? 0),
        employeeCount: Number(c.employeeCount ?? 0),
        customerCount: Number(c.customerCount ?? 0),
      })));
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useBusinessDashboard(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'dashboard', companyId],
    queryFn: () => businessService.getDashboard(token!, companyId!),
    enabled: Boolean(token && companyId),
    refetchInterval: 30_000,
  });
}

export function useBusinessAnalytics(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'analytics', companyId],
    queryFn: () => businessService.getAnalytics(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessEmployees(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'employees', companyId],
    queryFn: () => businessService.getEmployees(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessInventory(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'inventory', companyId],
    queryFn: () => businessService.getInventory(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessFinance(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'finance', companyId],
    queryFn: async () => {
      const [revenue, expenses, payroll, bank] = await Promise.all([
        businessService.getRevenue(token!, companyId!),
        businessService.getExpenses(token!, companyId!),
        businessService.getPayroll(token!, companyId!),
        businessService.getBank(token!, companyId!),
      ]);
      return { revenue, expenses, payroll, bank };
    },
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessCustomers(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'customers', companyId],
    queryFn: () => businessService.getCustomers(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessSuppliers(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'suppliers', companyId],
    queryFn: () => businessService.getSuppliers(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessBranches(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'branches', companyId],
    queryFn: () => businessService.getBranches(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessReports(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'reports', companyId],
    queryFn: () => businessService.getReports(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessSettings(companyId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['business', 'settings', companyId],
    queryFn: () => businessService.getSettings(token!, companyId!),
    enabled: Boolean(token && companyId),
  });
}

export function useBusinessAttendance() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, type }: { companyId: string; type: 'check_in' | 'check_out' }) =>
      businessService.recordAttendance(token!, companyId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business'] }),
  });
}
