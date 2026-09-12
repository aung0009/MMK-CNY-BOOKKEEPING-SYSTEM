import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers,
  PieChart,
  Wallet,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar
} from 'lucide-react';
import { ExchangeRateConfig, PaymentChannel, Transaction } from '../types';
import { channelLabels, formatCNY, formatCurrency, formatMMK } from '../lib/storage';

interface AnalyticsPageProps {
  transactions: Transaction[];
  rates: ExchangeRateConfig;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ transactions, rates }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('ALL');

  // 做账财务综合统计
  const stats = useMemo(() => {
    let fxVolumeCNY = 0;
    let fxVolumeMMK = 0;
    let fxGrossProfit = 0;
    let fxCount = 0;
    let cnyToMmkCount = 0;
    let mmkToCnyCount = 0;

    let totalIncomeCNY = 0;
    let totalIncomeMMK = 0;
    let incomeCount = 0;

    let totalExpenseCNY = 0;
    let totalExpenseMMK = 0;
    let expenseCount = 0;

    const channelStats: Record<string, number> = {};
    const categoryStats: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'EXCHANGE') {
        fxCount += 1;
        if (tx.direction === 'CNY_TO_MMK') {
          fxVolumeCNY += tx.fromAmount || 0;
          fxVolumeMMK += tx.toAmount || 0;
          cnyToMmkCount += 1;
        } else {
          fxVolumeMMK += tx.fromAmount || 0;
          fxVolumeCNY += tx.toAmount || 0;
          mmkToCnyCount += 1;
        }
        fxGrossProfit += tx.profitEstimated || 0;

        if (tx.inChannel) channelStats[tx.inChannel] = (channelStats[tx.inChannel] || 0) + 1;
        if (tx.outChannel) channelStats[tx.outChannel] = (channelStats[tx.outChannel] || 0) + 1;
      } else if (tx.type === 'INCOME') {
        incomeCount += 1;
        if (tx.currency === 'CNY') {
          totalIncomeCNY += tx.amount || 0;
        } else {
          totalIncomeMMK += tx.amount || 0;
        }
        if (tx.channel) channelStats[tx.channel] = (channelStats[tx.channel] || 0) + 1;
        if (tx.category) categoryStats[tx.category] = (categoryStats[tx.category] || 0) + (tx.amount || 0);
      } else if (tx.type === 'EXPENSE') {
        expenseCount += 1;
        if (tx.currency === 'CNY') {
          totalExpenseCNY += tx.amount || 0;
        } else {
          totalExpenseMMK += tx.amount || 0;
        }
        if (tx.channel) channelStats[tx.channel] = (channelStats[tx.channel] || 0) + 1;
        if (tx.category) categoryStats[tx.category] = (categoryStats[tx.category] || 0) + (tx.amount || 0);
      }
    });

    // 综合净利润 (CNY 计价)
    const netProfitCNY = fxGrossProfit + totalIncomeCNY - totalExpenseCNY;

    return {
      fxVolumeCNY,
      fxVolumeMMK,
      fxGrossProfit,
      fxCount,
      cnyToMmkCount,
      mmkToCnyCount,
      totalIncomeCNY,
      totalIncomeMMK,
      incomeCount,
      totalExpenseCNY,
      totalExpenseMMK,
      expenseCount,
      netProfitCNY,
      channelStats,
      categoryStats,
      totalRecords: transactions.length,
    };
  }, [transactions]);

  // 历史汇率走势模拟与今日汇率
  const rateTrendData = [
    { day: '09-06', sell: 602, buy: 612 },
    { day: '09-07', sell: 604, buy: 614 },
    { day: '09-08', sell: 605, buy: 616 },
    { day: '09-09', sell: 608, buy: 618 },
    { day: '09-10', sell: 607, buy: 617 },
    { day: '09-11', sell: 609, buy: 619 },
    { day: '今日实盘', sell: rates?.cnyToMmkSell ?? 610, buy: rates?.mmkToCnyBuy ?? 620 },
  ];

  // 渠道统计排行
  const topChannels = (Object.entries(stats.channelStats) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalChannelHits = topChannels.reduce((acc, cur) => acc + cur[1], 0) || 1;

  // 分类排行
  const topCategories = (Object.entries(stats.categoryStats) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 报表顶部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>缅中做账财务报表与经营分析</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            全维度核算换汇利差、营业收支、资金池流水与多渠道分布
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTimeRange('7D')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === '7D' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            近 7 天
          </button>
          <button
            onClick={() => setTimeRange('30D')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === '30D' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            近 30 天
          </button>
          <button
            onClick={() => setTimeRange('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            全部做账
          </button>
        </div>
      </div>

      {/* 4组核心综合财务经营指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 综合净利润 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">账面综合净盈亏 (CNY)</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${stats.netProfitCNY >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.netProfitCNY >= 0 ? '+' : ''}¥{formatCNY(stats.netProfitCNY)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            换汇毛利 + 收入 - 支出
          </span>
        </div>

        {/* 换汇利差毛利 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">换汇利差毛利</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            +¥{formatCNY(stats.fxGrossProfit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            共 {stats.fxCount} 笔换汇做账
          </span>
        </div>

        {/* 日常做账收入 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">日常营业收入 (入账)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            +¥{formatCNY(stats.totalIncomeCNY)}
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">
            +{formatMMK(stats.totalIncomeMMK)} MMK
          </span>
        </div>

        {/* 日常做账支出 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">日常运营支出 (扣账)</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            -¥{formatCNY(stats.totalExpenseCNY)}
          </div>
          <span className="text-[11px] text-rose-600 font-mono mt-0.5 block">
            -{formatMMK(stats.totalExpenseMMK)} MMK
          </span>
        </div>
      </div>

      {/* 资金盘总体周转规模 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 rounded-2xl border border-amber-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              🇨🇳 人民币周转总规模
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
              ¥ {formatCNY(stats.fxVolumeCNY)}
            </div>
            <span className="text-xs text-slate-600 mt-1 block">
              含兑换双向出入盘
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xl shadow-xs">
            ¥
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              🇲🇲 缅币周转总资金盘
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
              {formatMMK(stats.fxVolumeMMK)}
            </div>
            <span className="text-xs text-slate-600 mt-1 block">
              约合 {(stats.fxVolumeMMK / 100000000).toFixed(2)} 亿缅币
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            MMK
          </div>
        </div>
      </div>

      {/* 图表展示区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 近7日汇率走势折线图 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">中缅民间换汇手工汇率走势</h3>
              <p className="text-xs text-slate-400">1 人民币 兑 缅币 (MMK) 每日设定的买卖价</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 出缅币汇率
              </span>
              <span className="flex items-center gap-1 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 收缅币汇率
              </span>
            </div>
          </div>

          {/* SVG 汇率曲线 */}
          <div className="h-64 w-full relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* 背景参考横线 */}
              {[600, 610, 620].map((level) => {
                const y = 180 - ((level - 595) / 30) * 160;
                return (
                  <g key={level}>
                    <line x1="0" y1={y} x2="600" y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                    <text x="5" y={y - 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      {level} MMK
                    </text>
                  </g>
                );
              })}

              {/* 出缅币走势线 (Sell Rate) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={rateTrendData
                  .map((d, i) => {
                    const x = (i / (rateTrendData.length - 1)) * 560 + 20;
                    const y = 180 - ((d.sell - 595) / 30) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* 收缅币走势线 (Buy Rate) */}
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={rateTrendData
                  .map((d, i) => {
                    const x = (i / (rateTrendData.length - 1)) * 560 + 20;
                    const y = 180 - ((d.buy - 595) / 30) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* 数据节点圆圈与标签 */}
              {rateTrendData.map((d, i) => {
                const x = (i / (rateTrendData.length - 1)) * 560 + 20;
                const ySell = 180 - ((d.sell - 595) / 30) * 160;
                const yBuy = 180 - ((d.buy - 595) / 30) * 160;
                return (
                  <g key={d.day}>
                    <circle cx={x} cy={ySell} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={x} cy={yBuy} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <text x={x} y="195" textAnchor="middle" fill="#64748b" fontSize="10">
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 业务方向结构与收付款渠道分布 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">换汇方向结构与结算渠道</h3>
            <p className="text-xs text-slate-400">两地币种流转倾向及资金出入渠道分布</p>
          </div>

          {/* 换汇方向比例条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>收人民币 出缅币 ({stats.cnyToMmkCount}笔)</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-700">
                <span>收缅币 出人民币 ({stats.mmkToCnyCount}笔)</span>
                <ArrowUpRight className="w-4 h-4 text-sky-600" />
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${stats.fxCount > 0 ? (stats.cnyToMmkCount / stats.fxCount) * 100 : 50}%`,
                }}
                className="bg-emerald-500 h-full transition-all duration-500"
              />
              <div
                style={{
                  width: `${stats.fxCount > 0 ? (stats.mmkToCnyCount / stats.fxCount) * 100 : 50}%`,
                }}
                className="bg-sky-500 h-full transition-all duration-500"
              />
            </div>
          </div>

          {/* 常用支付渠道分布进度条 */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-700 block">高频出入金渠道分布:</span>
            {topChannels.map(([channelKey, count]) => {
              const pct = Math.round((count / totalChannelHits) * 100);
              return (
                <div key={channelKey} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                      {channelLabels[channelKey as PaymentChannel]?.flag || '💳'} {channelLabels[channelKey as PaymentChannel]?.label || channelKey}
                    </span>
                    <span className="font-mono text-slate-500">{count} 笔 ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

