'use client';

import { useState } from 'react';
import { useHaptic } from '@/hooks/useSound';

type Mode = 'basic' | 'scientific';

const SCIENTIFIC = ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', '(', ')'];

export function CalculatorApp() {
  const { tap } = useHaptic();
  const [mode, setMode] = useState<Mode>('basic');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState(0);
  const [currencyRate] = useState(1.08);
  const [unitFrom] = useState('km');
  const [unitTo] = useState('mi');

  const input = (val: string) => {
    tap();
    setDisplay((d) => (d === '0' && val !== '.' ? val : d + val));
  };

  const clear = () => { tap(); setDisplay('0'); };
  const backspace = () => { tap(); setDisplay((d) => d.length <= 1 ? '0' : d.slice(0, -1)); };

  const calculate = () => {
    tap();
    try {
      let expr = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, String(Math.PI));
      for (const fn of ['sin', 'cos', 'tan', 'log', 'ln']) {
        expr = expr.replace(new RegExp(`${fn}\\(`, 'g'), `Math.${fn === 'log' ? 'log10' : fn}(`);
      }
      expr = expr.replace(/√\(/g, 'Math.sqrt(').replace(/x²/g, '**2');
      const result = Function(`"use strict"; return (${expr})`)() as number;
      const formatted = Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : 'Error';
      setHistory((h) => [`${display} = ${formatted}`, ...h].slice(0, 20));
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
    }
  };

  const convertCurrency = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      const converted = val * currencyRate;
      setHistory((h) => [`${val} USD = ${converted.toFixed(2)} EUR`, ...h].slice(0, 20));
      setDisplay(String(Math.round(converted * 100) / 100));
    }
  };

  const convertUnits = () => {
    const val = parseFloat(display);
    if (!isNaN(val) && unitFrom === 'km' && unitTo === 'mi') {
      const converted = val * 0.621371;
      setHistory((h) => [`${val} km = ${converted.toFixed(2)} mi`, ...h].slice(0, 20));
      setDisplay(String(Math.round(converted * 100) / 100));
    }
  };

  const buttons = mode === 'basic'
    ? ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', 'M+', '0', '.', '=']
    : [...SCIENTIFIC, 'C', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];

  const handleBtn = (b: string) => {
    if (b === 'C') clear();
    else if (b === '⌫') backspace();
    else if (b === '=') calculate();
    else if (b === 'M+') { setMemory(memory + parseFloat(display || '0')); tap(); }
    else if (['+', '-', '×', '÷', '%', '.', ...SCIENTIFIC].includes(b) || /^\d$/.test(b)) input(b);
    else input(b);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="p-4 flex gap-2">
        {(['basic', 'scientific'] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`px-4 py-1 rounded-full text-xs capitalize ${mode === m ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'}`}>{m}</button>
        ))}
        <button type="button" onClick={convertCurrency} className="px-3 py-1 rounded-full text-xs bg-white/10 text-white">USD→EUR</button>
        <button type="button" onClick={convertUnits} className="px-3 py-1 rounded-full text-xs bg-white/10 text-white">km→mi</button>
      </div>
      <div className="px-6 py-4 text-right">
        {memory !== 0 && <p className="text-white/30 text-xs">M: {memory}</p>}
        <p className="text-4xl font-extralight text-white tabular-nums break-all">{display}</p>
      </div>
      <div className={`flex-1 grid gap-2 p-4 ${mode === 'scientific' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {buttons.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => handleBtn(b)}
            className={`aspect-square rounded-2xl text-lg font-medium ${
              b === '=' ? 'bg-gulf-gold text-black' :
              ['+', '-', '×', '÷', '%', 'C', '⌫'].includes(b) ? 'bg-white/20 text-white' :
              'bg-white/10 text-white'
            } ${b === '0' && mode === 'basic' ? 'col-span-2 aspect-auto py-4' : ''}`}
          >
            {b}
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="p-4 border-t border-white/10 max-h-24 overflow-y-auto">
          <p className="text-xs text-white/40 uppercase mb-1">History</p>
          {history.slice(0, 3).map((h, i) => <p key={i} className="text-xs text-white/50 font-mono">{h}</p>)}
        </div>
      )}
    </div>
  );
}
