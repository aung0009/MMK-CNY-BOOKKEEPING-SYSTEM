import React, { useState } from 'react';
import { 
  Settings, 
  TrendingUp, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Info,
  Calendar,
  Plus
} from 'lucide-react';
import { DailyRateRecord, ExchangeRateConfig } from '../types';
import { exportAllDataJSON, formatCNY, formatMMK, importAllDataJSON, resetToDemoData } from '../lib/storage';

interface RatesAndSettingsPageProps {
  rates: ExchangeRateConfig;
  dailyRates?: DailyRateRecord[];
  onUpdateRates: (newRates: ExchangeRateConfig) => void;
  onSaveDailyRate?: (record: DailyRateRecord) => void;
  onReloadAllData: () => void;
}

export const RatesAndSettingsPage: React.FC<RatesAndSettingsPageProps> = ({
  rates,
  dailyRates = [],
  onUpdateRates,
  onSaveDailyRate,
  onReloadAllData,
}) => {
  const [sellRate, setSellRate] = useState(rates.cnyToMmkSell.toString());
  const [buyRate, setBuyRate] = useState(rates.mmkToCnyBuy.toString());
  const [benchRate, setBenchRate] = useState(rates.marketBenchmark.toString());
  const [costSell, setCostSell] = useState(rates.costCnyToMmk.toString());
  const [costBuy, setCostBuy] = useState(rates.costMmkToCny.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 每日汇率补录状态
  const todayStr = new Date().toISOString().slice(0, 10);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [recordSell, setRecordSell] = useState(rates.cnyToMmkSell.toString());
  const [recordBuy, setRecordBuy] = useState(rates.mmkToCnyBuy.toString());
  const [recordNote, setRecordNote] = useState('日常开盘基准汇率');
  const [rateRecordSuccess, setRateRecordSuccess] = useState(false);

  // 导入数据状态
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const sell = parseFloat(sellRate);
    const buy = parseFloat(buyRate);
    const bench = parseFloat(benchRate);
    const cSell = parseFloat(costSell);
    const cBuy = parseFloat(costBuy);

    if (isNaN(sell) || isNaN(buy) || sell <= 0 || buy <= 0) {
      alert('请输入有效的汇率数值');
      return;
    }

    const updated: ExchangeRateConfig = {
      cnyToMmkSell: sell,
      mmkToCnyBuy: buy,
      marketBenchmark: bench || (sell + buy) / 2,
      costCnyToMmk: cSell || sell + 3,
      costMmkToCny: cBuy || buy - 3,
      updatedAt: new Date().toISOString(),
    };

    onUpdateRates(updated);

    // 联动保存到每日汇率记录中
    if (onSaveDailyRate) {
      onSaveDailyRate({
        id: `rate_${Date.now()}`,
        date: todayStr,
        cnyToMmkSell: sell,
        mmkToCnyBuy: buy,
        operator: '系统出纳',
        note: '实时牌价更新保存',
        createdAt: new Date().toISOString(),
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // 保存特定日期的手工汇率档案
  const handleAddDailyRateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const sell = parseFloat(recordSell);
    const buy = parseFloat(recordBuy);
    if (!recordDate || isNaN(sell) || isNaN(buy)) {
      alert('请完整填写日期与汇率数值');
      return;
    }

    if (onSaveDailyRate) {
      onSaveDailyRate({
        id: `rate_${Date.now()}`,
        date: recordDate,
        cnyToMmkSell: sell,
        mmkToCnyBuy: buy,
        operator: '手工录入',
        note: recordNote || '手动录入日汇率',
        createdAt: new Date().toISOString(),
      });
    }

    // 若录入的是今天，同时应用为当前最新生效汇率
    if (recordDate === todayStr) {
      onUpdateRates({
        ...rates,
        cnyToMmkSell: sell,
        mmkToCnyBuy: buy,
        updatedAt: new Date().toISOString(),
      });
      setSellRate(sell.toString());
      setBuyRate(buy.toString());
    }

    setRateRecordSuccess(true);
    setTimeout(() => setRateRecordSuccess(false), 3000);
  };

  // 快捷加点/减点
  const applySpreadOffset = (offset: number) => {
    const newSell = (parseFloat(sellRate) + offset).toString();
    const newBuy = (parseFloat(buyRate) + offset).toString();
    setSellRate(newSell);
    setBuyRate(newBuy);
  };

  // 导出 JSON
  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `中缅换汇系统完整数据备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入 JSON
  const handleConfirmImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importAllDataJSON(importJsonText.trim());
    if (ok) {
      alert('备份数据导入成功！页面将刷新最新数据。');
      onReloadAllData();
      setShowImportBox(false);
      setImportJsonText('');
    } else {
      alert('导入失败，请检查 JSON 格式是否完整有效。');
    }
  };

  // 重置演示数据
  const handleResetDemo = () => {
    if (confirm('确定要恢复为系统初始演示数据吗？当前新增的账目将被重置。')) {
      resetToDemoData();
      onReloadAllData();
      alert('已重置为系统初始演示数据！');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 业务概念卡片 */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 p-5 sm:p-6 rounded-3xl border border-amber-200/70 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <h3 className="font-bold text-base text-slate-900">
              什么是“中缅 MMK 与 人民币 换汇做账系统”？
            </h3>
            <p className="leading-relaxed">
              本系统专为<strong>中缅边贸换汇、日常收支记账、资金池管理与报表汇总</strong>量身打造。汇率支持每日纯手动按实际市价输入，满足不同日期不同牌价的做账核算需求。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                <span className="font-bold text-slate-900 block mb-0.5">1. 每日手动输入汇率</span>
                <span className="text-slate-600">
                  出缅币（客户付CNY买MMK）与收缅币（客户付MMK买CNY）每一天牌价不同，实时按录入汇率精准核算换汇利差与账面收入。
                </span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                <span className="font-bold text-slate-900 block mb-0.5">2. 综合做账与资金平账</span>
                <span className="text-slate-600">
                  支持换汇、日常收入与费用支出分类记账，自动核算净利润并实时联动 KBZPay、WaveMoney、微信等账户余额。
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 今日即时生效汇率配置 */}
      <form onSubmit={handleSaveRates} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>今日换汇核心牌价配置 (即时生效)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              修改后将即时作为“记一笔”即时开单与换汇计算的基准汇率
            </p>
          </div>

          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in font-medium">
              <Check className="w-4 h-4" />
              <span>汇率已成功保存生效！</span>
            </span>
          )}
        </div>

        {/* 快捷点差微调 */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-500 font-medium">快捷大盘微调:</span>
          {[-2, -1, -0.5, 0.5, 1, 2].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => applySpreadOffset(num)}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
            >
              {num > 0 ? `+${num}` : num} 点
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 出缅币汇率 (Sell MMK) */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950">
                出缅币报价 (客户付CNY买MMK):
              </label>
              <span className="text-[11px] text-emerald-700 font-mono">1 CNY = ? MMK</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                value={sellRate}
                onChange={(e) => setSellRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-lg font-bold font-mono text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">MMK</span>
            </div>
            <p className="text-[11px] text-slate-500">
              例如 610 代表客户支付 10,000 元人民币，获得 6,100,000 缅币
            </p>
          </div>

          {/* 收缅币汇率 (Buy MMK) */}
          <div className="p-4 bg-sky-50/40 rounded-xl border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-950">
                收缅币报价 (客户付MMK买CNY):
              </label>
              <span className="text-[11px] text-sky-700 font-mono">? MMK = 1 CNY</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                value={buyRate}
                onChange={(e) => setBuyRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-lg font-bold font-mono text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">MMK</span>
            </div>
            <p className="text-[11px] text-slate-500">
              例如 620 代表客户支付 6,200,000 缅币，获得 10,000 元人民币
            </p>
          </div>
        </div>

        {/* 底单成本价与基准公价 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              市场参考中位数公价:
            </label>
            <input
              type="number"
              step="0.5"
              value={benchRate}
              onChange={(e) => setBenchRate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
              placeholder="如: 615"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              我方出缅币底单成本:
            </label>
            <input
              type="number"
              step="0.5"
              value={costSell}
              onChange={(e) => setCostSell(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
              placeholder="如: 614"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              我方收缅币底单成本:
            </label>
            <input
              type="number"
              step="0.5"
              value={costBuy}
              onChange={(e) => setCostBuy(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
              placeholder="如: 613"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
          >
            保存并立即生效最新汇率
          </button>
        </div>
      </form>

      {/* 历史每日手动汇率录入与台账卡片 */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>每日手动汇率档案库 (历史记录与补录)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              记录每一天不同的实际汇率，方便随时追溯与特定日期做账使用
            </p>
          </div>

          {rateRecordSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>日汇率已保存！</span>
            </span>
          )}
        </div>

        {/* 手动录入表单 */}
        <form onSubmit={handleAddDailyRateRecord} className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">记录日期</label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">出缅币汇率 (Sell)</label>
            <input
              type="number"
              step="0.1"
              required
              value={recordSell}
              onChange={(e) => setRecordSell(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
              placeholder="如 610"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">收缅币汇率 (Buy)</label>
            <input
              type="number"
              step="0.1"
              required
              value={recordBuy}
              onChange={(e) => setRecordBuy(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sky-700"
              placeholder="如 620"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">说明备注</label>
            <input
              type="text"
              value={recordNote}
              onChange={(e) => setRecordNote(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              placeholder="如 当日木姐口岸行情"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>保存日汇率</span>
            </button>
          </div>
        </form>

        {/* 历史汇率记录列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-2.5 font-medium">日期</th>
                <th className="p-2.5 font-medium">出缅币价 (1 CNY = ? MMK)</th>
                <th className="p-2.5 font-medium">收缅币价 (? MMK = 1 CNY)</th>
                <th className="p-2.5 font-medium">利差 (Spread)</th>
                <th className="p-2.5 font-medium">备注说明</th>
                <th className="p-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    暂无历史汇率档案，点击上方表单可录入每日汇率
                  </td>
                </tr>
              ) : (
                dailyRates.map((rec) => {
                  const spread = (rec.mmkToCnyBuy - rec.cnyToMmkSell).toFixed(1);
                  return (
                    <tr key={rec.id || rec.date} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{rec.date}</td>
                      <td className="p-2.5 font-mono font-semibold text-emerald-600">
                        {rec.cnyToMmkSell}
                      </td>
                      <td className="p-2.5 font-mono font-semibold text-sky-600">
                        {rec.mmkToCnyBuy}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {spread} 点
                      </td>
                      <td className="p-2.5 text-slate-500">{rec.note || '-'}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSellRate(rec.cnyToMmkSell.toString());
                            setBuyRate(rec.mmkToCnyBuy.toString());
                            onUpdateRates({
                              ...rates,
                              cnyToMmkSell: rec.cnyToMmkSell,
                              mmkToCnyBuy: rec.mmkToCnyBuy,
                              updatedAt: new Date().toISOString(),
                            });
                            alert(`已将 ${rec.date} 汇率应用为当前实时牌价！`);
                          }}
                          className="px-2 py-1 rounded text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors font-medium"
                        >
                          应用为今日牌价
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 数据安全与备份管理卡片 */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <span>数据备份、恢复与系统维护</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            所有做账数据均保存在浏览器本地，支持定期导出离线备份 JSON 文件保障资产安全
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 备份导出 */}
          <button
            onClick={handleExportBackup}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-start gap-1 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-1">
              <Download className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">导出数据备份 (JSON)</span>
            <span className="text-[11px] text-slate-500">将流水账本、每日汇率库、资金账户下载至本地保存</span>
          </button>

          {/* 恢复备份 */}
          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-start gap-1 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold mb-1">
              <Upload className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800">恢复备份文件</span>
            <span className="text-[11px] text-slate-500">粘贴或上传历史 JSON 备份恢复全部数据</span>
          </button>

          {/* 重置演示数据 */}
          <button
            onClick={handleResetDemo}
            className="p-4 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 flex flex-col items-start gap-1 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-1">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-rose-900">重置初始演示数据</span>
            <span className="text-[11px] text-rose-600/80">恢复包含 KBZPay、微信、换汇与收支示例的样例数据</span>
          </button>
        </div>

        {/* 导入输入抽屉 */}
        {showImportBox && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
            <label className="block font-bold text-slate-700">粘贴 JSON 备份数据代码:</label>
            <textarea
              rows={5}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="请粘贴导出的 JSON 格式备份文本..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
              >
                确认导入并覆盖恢复
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
