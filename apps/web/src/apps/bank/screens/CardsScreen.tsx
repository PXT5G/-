'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { BankCardVisual } from '../components/BankCardVisual';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function CardsScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['bank', 'cards'],
    queryFn: () => bankService.getCards(),
  });

  const freezeMutation = useMutation({
    mutationFn: (id: string) => bankService.freezeCard(id),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['bank', 'cards'] }); },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => bankService.unfreezeCard(id),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['bank', 'cards'] }); },
  });

  if (isLoading || !cards?.length) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const card = cards[activeIndex];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Cards</h1>

      <BankCardVisual card={card} flipped={flipped} onFlip={() => { tap(); setFlipped(!flipped); }} />

      {cards.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {cards.map((_, i) => (
            <button key={i} type="button" onClick={() => setActiveIndex(i)} className={`w-2 h-2 rounded-full ${i === activeIndex ? 'bg-banana-gold' : 'bg-white/20'}`} />
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between">
          <span className="text-white/60 text-sm">Daily Limit</span>
          <span className="text-white text-sm">{card.dailyLimit.toLocaleString()} BNA</span>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between">
          <span className="text-white/60 text-sm">Monthly Limit</span>
          <span className="text-white text-sm">{card.monthlyLimit.toLocaleString()} BNA</span>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between">
          <span className="text-white/60 text-sm">Monthly Spent</span>
          <span className="text-white text-sm">{card.monthlySpent.toLocaleString()} BNA</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {card.frozen ? (
          <Button label="Unfreeze Card" onClick={() => { tap(); unfreezeMutation.mutate(card.id); }} fullWidth variant="secondary" />
        ) : (
          <Button label="Freeze Card" onClick={() => { tap(); freezeMutation.mutate(card.id); }} fullWidth variant="destructive" />
        )}
      </div>
    </div>
  );
}
