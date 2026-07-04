'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/contactsService';
import { Button } from '@/components/shared/Button';

export function GroupsScreen() {
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['contacts', 'groups'],
    queryFn: () => contactsService.getGroups(),
  });

  const createMutation = useMutation({
    mutationFn: () => contactsService.createGroup(newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setNewName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-3">Contact Groups</p>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="New group name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
        />
        <Button label="Add" onClick={() => createMutation.mutate()} loading={createMutation.isPending} size="sm" disabled={!newName.trim()} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : groups.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No groups yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-lg">{g.icon ?? '👥'}</span>
                <div>
                  <p className="text-white text-sm font-medium">{g.name}</p>
                  <p className="text-white/40 text-xs">{g.contactCount} contacts</p>
                </div>
              </div>
              <button type="button" onClick={() => deleteMutation.mutate(g.id)} className="text-red-400 text-xs px-2 py-1">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
