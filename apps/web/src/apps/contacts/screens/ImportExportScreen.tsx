'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';
import { Button } from '@/components/shared/Button';

export function ImportExportScreen() {
  const [importText, setImportText] = useState('');
  const [exportData, setExportData] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (contacts: Array<{ firstName: string; lastName?: string; phoneNumbers: Array<{ number: string; label: 'mobile'; primary: boolean }>; email?: string }>) =>
      contactsService.importContacts(contacts),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => contactsService.exportContacts(),
    onSuccess: (data) => setExportData(JSON.stringify(data, null, 2)),
  });

  const syncMutation = useMutation({
    mutationFn: () => contactsService.syncIdentity(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const contacts = Array.isArray(parsed) ? parsed : [parsed];
      const formatted = contacts.map((c: { firstName?: string; name?: string; lastName?: string; phone?: string; phoneNumbers?: Array<{ number: string }>; email?: string }) => ({
        firstName: c.firstName ?? c.name?.split(' ')[0] ?? 'Unknown',
        lastName: c.lastName ?? c.name?.split(' ').slice(1).join(' '),
        phoneNumbers: c.phoneNumbers?.map((p, i) => ({ number: p.number, label: 'mobile' as const, primary: i === 0 }))
          ?? [{ number: c.phone ?? '', label: 'mobile' as const, primary: true }],
        email: c.email,
      })).filter((c) => c.phoneNumbers[0]?.number);
      importMutation.mutate(formatted);
    } catch {
      setResult({ imported: 0, failed: 1 });
    }
  };

  const copyExport = () => {
    if (exportData) navigator.clipboard.writeText(exportData);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-banana-gold text-sm font-semibold mb-2">Sync from Identity</p>
        <p className="text-white/40 text-xs mb-3">Add your verified BananaOS Identity as a contact.</p>
        <Button label="Sync Identity" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending} size="sm" />
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-white text-sm font-semibold mb-2">Import Contacts</p>
        <p className="text-white/40 text-xs mb-2">Paste JSON array of contacts with firstName, phone/phoneNumbers, email.</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='[{"firstName":"John","phone":"+1-555-0100"}]'
          rows={4}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono mb-2"
        />
        <Button label="Import" onClick={handleImport} loading={importMutation.isPending} size="sm" disabled={!importText.trim()} />
        {result && <p className="text-white/50 text-xs mt-2">{result.imported} imported, {result.failed} failed</p>}
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-white text-sm font-semibold mb-2">Export Contacts</p>
        <Button label="Export All" onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} size="sm" />
        {exportData && (
          <div className="mt-3">
            <button type="button" onClick={copyExport} className="text-banana-gold text-xs mb-2">Copy to clipboard</button>
            <pre className="bg-black/50 rounded-lg p-2 text-[10px] text-white/60 overflow-auto max-h-40">{exportData.slice(0, 500)}{exportData.length > 500 ? '...' : ''}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
