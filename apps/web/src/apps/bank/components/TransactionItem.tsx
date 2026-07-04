'use client';

import { motion } from 'framer-motion';
import type { Transaction } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isIncome = transaction.direction === 'income';
  const statusColors: Record<string, string> = {
    completed: 'text-green-400',
    pending: 'text-yellow-400',
    failed: 'text-red-400',
    cancelled: 'text-white/40',
  };

  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 py-3 border-b border-white/5 text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isIncome ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
        {isIncome ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{transaction.description}</p>
        <p className="text-[10px] text-white/40">
          {new Date(transaction.createdAt).toLocaleString()} · {transaction.category}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-white'}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)}
        </p>
        <p className={`text-[9px] capitalize ${statusColors[transaction.status] ?? 'text-white/40'}`}>
          {transaction.status}
        </p>
      </div>
    </motion.button>
  );
}
