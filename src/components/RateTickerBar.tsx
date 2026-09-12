import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Clock, Edit3, TrendingUp, RefreshCw, Check } from 'lucide-react';
import { ExchangeRateConfig } from '../types';
import { formatMMK } from '../lib/storage';

interface RateTickerBarProps {
  rates: ExchangeRateConfig;
  onUpdateRates: (newRates: ExchangeRateConfig) => void;
  onNavigateToSettings?: () => void;
}

export const RateTickerBar: React.FC<RateTickerBarProps> = ({ rates, onUpdateRates, onNavigateToSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editSell, setEditSell] = useState(rates.cnyToMmkSell.toString());
  const [editBuy, setEditBuy] = useState(rates.mmkToCnyBuy.toString());
  const [editBench, setEditBench] = useState(rates.marketBenchmark.toString());
  const [currentTime, setCurrentTime] = useState({
    beijing: '',
    yangon: '',
  });

  // 时区时间同步
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // 北京时间 (UTC+8)
      const bOption: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      // 仰光时间 (UTC+6:30)
      const yOption: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Yangon',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setCurrentTime({
        beijing: new Intl.DateTimeFormat('zh-CN', bOption).format(now),
        yangon: new Intl.DateTimeFormat('en-US', yOption).format(now),
      });
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const sell = parseFloat(editSell);
    const buy = parseFloat(editBuy);
    const bench = parseFloat(editBench) || rates.marketBenchmark;

    if (!isNaN(sell) && !isNaN(buy) && sell > 0 && buy > 0) {
      onUpdateRates({
        ...rates,
        cnyToMmkSell: sell,
        mmkToCnyBuy: buy,
        marketBenchmark: bench,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-sm relative z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          {/* 实时汇率行情 */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>中缅今日行情</span>
            </span>

            {/* 出MMK报价 (收人民币) */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
              <span className="text-slate-400">出缅币(卖):</span>
              <span className="font-mono font-bold text-emerald-400">
                1 CNY = {formatMMK(rates.cnyToMmkSell)} MMK
              </span>
            </div>

            {/* 收MMK报价 (出人民币) */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
              <span className="text-slate-400">收缅币(买):</span>
              <span className="font-mono font-bold text-sky-400">
                {formatMMK(rates.mmkToCnyBuy)} MMK = 1 CNY
              </span>
            </div>

            {/* 点差 Spread */}
            <div className="hidden md:flex items-center gap-1 text-slate-400 font-mono text-xs">
              <span>点差:</span>
              <span className="text-amber-300 font-medium">
                {(rates.mmkToCnyBuy - rates.cnyToMmkSell).toFixed(1)} 点
              </span>
            </div>

            {/* 快速修改汇率按钮 */}
            <button
              id="btn-quick-edit-rate"
              type="button"
              onClick={() => {
                setEditSell(rates.cnyToMmkSell.toString());
                setEditBuy(rates.mmkToCnyBuy.toString());
                setEditBench(rates.marketBenchmark.toString());
                setIsEditing(!isEditing);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
              title="快速调整今日汇率报价"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>调价</span>
            </button>
          </div>

          {/* 双时区时间显示 */}
          <div className="flex items-center gap-3 text-slate-400 font-mono text-xs ml-auto">
            <div className="flex items-center gap-1" title="缅甸仰光时间 (UTC+6:30)">
              <span className="text-slate-500">🇲🇲仰光:</span>
              <span className="text-slate-200">{currentTime.yangon || '--:--:--'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1" title="中国北京时间 (UTC+8:00)">
              <span className="text-slate-500">🇨🇳北京:</span>
              <span className="text-slate-200">{currentTime.beijing || '--:--:--'}</span>
            </div>
          </div>
        </div>

        {/* 快捷修改汇率抽屉面板 */}
        {isEditing && (
          <form
            onSubmit={handleSaveRates}
            className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-slate-950/70 p-3 rounded-lg border border-slate-700"
          >
            <div>
              <label className="block text-xs text-emerald-400 mb-1 font-medium">
                出缅币报价 (客户拿CNY买MMK):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={editSell}
                  onChange={(e) => setEditSell(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-1.5 rounded text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="如: 610"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-slate-500">MMK</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-sky-400 mb-1 font-medium">
                收缅币报价 (客户拿MMK买CNY):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={editBuy}
                  onChange={(e) => setEditBuy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-1.5 rounded text-sm focus:outline-none focus:border-sky-500"
                  placeholder="如: 620"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-slate-500">MMK</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                中间参考公价:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={editBench}
                  onChange={(e) => setEditBench(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-1.5 rounded text-sm focus:outline-none focus:border-amber-500"
                  placeholder="如: 615"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-slate-500">MMK</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 px-3 rounded text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>更新今日牌价</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
