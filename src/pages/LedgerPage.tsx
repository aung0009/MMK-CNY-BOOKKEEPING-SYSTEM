import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowLeftRight,
  Layers,
  PlusCircle,
  Tag,
  Calendar,
  Wallet
} from 'lucide-react';
import { ExchangeDirection, PaymentChannel, SettlementStatus, Transaction, TransactionType } from '../types';
import { channelLabels, formatCNY, formatCurrency, formatMMK, statusLabels, typeLabels } from '../lib/storage';

interface LedgerPageProps {
  transactions: Transaction[];
  onOpenReceipt: (tx: Transaction) => void;
  onUpdateStatus: (id: string, newStatus: SettlementStatus) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToEntry: () => void;
}

export const LedgerPage: React.FC<LedgerPageProps> = ({
  transactions,
  onOpenReceipt,
  onUpdateStatus,
  onDeleteTransaction,
  onNavigateToEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SettlementStatus>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'CNY' | 'MMK'>('ALL');

  // 筛选与排序流水
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      // 关键字搜索
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        tx.orderNo.toLowerCase().includes(q) ||
        (tx.counterparty && tx.counterparty.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q)) ||
        (tx.operator && tx.operator.toLowerCase().includes(q)) ||
        (tx.note && tx.note.toLowerCase().includes(q));

      // 类型筛选 (换汇 / 收入 / 支出)
      const matchType = typeFilter === 'ALL' || tx.type === typeFilter;

      // 状态筛选
      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;

      // 币种筛选
      let matchCurrency = true;
      if (currencyFilter !== 'ALL') {
        if (tx.type === 'EXCHANGE') {
          matchCurrency = tx.fromCurrency === currencyFilter || tx.toCurrency === currencyFilter;
        } else {
          matchCurrency = tx.currency === currencyFilter;
        }
      }

      return matchSearch && matchType && matchStatus && matchCurrency;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter, currencyFilter]);

  // 汇总统计指标
  const metrics = useMemo(() => {
    let fxVolumeCNY = 0;
    let fxVolumeMMK = 0;
    let fxProfitCNY = 0;
    let incomeCNY = 0;
    let incomeMMK = 0;
    let expenseCNY = 0;
    let expenseMMK = 0;
    let pendingCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'PENDING') {
        pendingCount += 1;
      }

      if (tx.type === 'EXCHANGE') {
        if (tx.direction === 'CNY_TO_MMK') {
          fxVolumeCNY += tx.fromAmount || 0;
          fxVolumeMMK += tx.toAmount || 0;
        } else {
          fxVolumeMMK += tx.fromAmount || 0;
          fxVolumeCNY += tx.toAmount || 0;
        }
        fxProfitCNY += tx.profitEstimated || 0;
      } else if (tx.type === 'INCOME') {
        if (tx.currency === 'CNY') {
          incomeCNY += tx.amount || 0;
        } else {
          incomeMMK += tx.amount || 0;
        }
      } else if (tx.type === 'EXPENSE') {
        if (tx.currency === 'CNY') {
          expenseCNY += tx.amount || 0;
        } else {
          expenseMMK += tx.amount || 0;
        }
      }
    });

    const netProfitCNY = fxProfitCNY + incomeCNY - expenseCNY;

    return {
      fxVolumeCNY,
      fxVolumeMMK,
      fxProfitCNY,
      incomeCNY,
      incomeMMK,
      expenseCNY,
      expenseMMK,
      netProfitCNY,
      pendingCount,
    };
  }, [transactions]);

  // 导出 CSV 功能
  const handleExportCSV = () => {
    const headers = [
      '单号',
      '记账日期',
      '类型',
      '分类',
      '对方名称/经手',
      '金额/方向',
      '成交汇率',
      '毛利/金额',
      '账户渠道',
      '状态',
      '经办出纳',
      '备注'
    ];
    
    const rows = filteredList.map((tx) => {
      let desc = '';
      let rateStr = '';
      let profitOrAmount = '';
      let channelStr = '';

      if (tx.type === 'EXCHANGE') {
        desc = tx.direction === 'CNY_TO_MMK' 
          ? `收 ${tx.fromAmount} CNY -> 付 ${tx.toAmount} MMK` 
          : `收 ${tx.fromAmount} MMK -> 付 ${tx.toAmount} CNY`;
        rateStr = `1:${tx.rate}`;
        profitOrAmount = `毛利 ¥${tx.profitEstimated || 0}`;
        channelStr = `${channelLabels[tx.inChannel || 'Other']?.label} -> ${channelLabels[tx.outChannel || 'Other']?.label}`;
      } else if (tx.type === 'INCOME') {
        desc = `+${tx.amount} ${tx.currency}`;
        profitOrAmount = `+${tx.amount} ${tx.currency}`;
        channelStr = channelLabels[tx.channel || 'Other']?.label || '';
      } else {
        desc = `-${tx.amount} ${tx.currency}`;
        profitOrAmount = `-${tx.amount} ${tx.currency}`;
        channelStr = channelLabels[tx.channel || 'Other']?.label || '';
      }

      return [
        tx.orderNo,
        tx.date || tx.createdAt?.slice(0, 10),
        typeLabels[tx.type]?.text || tx.type,
        tx.category || (tx.type === 'EXCHANGE' ? '货币兑换' : '-'),
        `"${tx.counterparty || '散户/常规'}"`,
        `"${desc}"`,
        rateStr,
        profitOrAmount,
        `"${channelStr}"`,
        statusLabels[tx.status]?.text || tx.status,
        tx.operator || '',
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `缅中做账全量流水账本_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16">
      {/* 顶部财务做账统计看板 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 换汇盘子规模 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">换汇累计成交额</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            ¥{formatCNY(metrics.fxVolumeCNY)}
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">
            {formatMMK(metrics.fxVolumeMMK)} MMK
          </span>
        </div>

        {/* 换汇毛利 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">换汇利差毛利 (CNY)</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 mt-1">
            +¥{formatCNY(metrics.fxProfitCNY)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">核心利差收益</span>
        </div>

        {/* 日常收支净差 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">日常收支 (入 / 出)</span>
          <div className="text-xs sm:text-sm font-bold font-mono mt-1 space-y-0.5">
            <div className="text-emerald-600">
              入: +¥{formatCNY(metrics.incomeCNY)} | {formatMMK(metrics.incomeMMK)} Ks
            </div>
            <div className="text-rose-600">
              出: -¥{formatCNY(metrics.expenseCNY)} | {formatMMK(metrics.expenseMMK)} Ks
            </div>
          </div>
        </div>

        {/* 待办核销流水 */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ALL' ? 'PENDING' : 'ALL')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-xs text-slate-500 font-medium block">待核销 / 在途流水</span>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 mt-1 flex items-center gap-1.5">
            <span>{metrics.pendingCount} 笔</span>
            {metrics.pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">点击过滤待处理</span>
        </div>
      </div>

      {/* 搜索与多维度筛选栏 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              id="input-ledger-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索单号、经手人、分类标签、交易备注..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 导出与快捷录入按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              id="btn-export-ledger-csv"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>导出账本 (CSV)</span>
            </button>

            <button
              onClick={onNavigateToEntry}
              id="btn-goto-entry-from-ledger"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>记一笔</span>
            </button>
          </div>
        </div>

        {/* 筛选按钮组 */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>筛选:</span>
          </span>

          {/* 业务类型筛选 */}
          <select
            id="filter-type-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">全部记账类型 (全部)</option>
            <option value="EXCHANGE">🔄 换汇业务流水</option>
            <option value="INCOME">🟢 日常收入记账</option>
            <option value="EXPENSE">🔴 日常支出记账</option>
          </select>

          {/* 币种筛选 */}
          <select
            id="filter-currency-select"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">全部结算币种</option>
            <option value="CNY">🇨🇳 人民币 CNY</option>
            <option value="MMK">🇲🇲 缅币 MMK</option>
          </select>

          {/* 结算状态筛选 */}
          <select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">全部核销状态</option>
            <option value="COMPLETED">✅ 已记账结清</option>
            <option value="PENDING">⏳ 待核销/在途</option>
          </select>

          {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || currencyFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setCurrencyFilter('ALL');
                setSearchTerm('');
              }}
              className="text-amber-600 hover:underline px-2 py-1 font-medium"
            >
              重置筛选
            </button>
          )}

          <span className="ml-auto text-slate-400">
            筛选出 <strong className="text-slate-800">{filteredList.length}</strong> 条做账记录
          </span>
        </div>
      </div>

      {/* 交易流水明细列表 */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-medium text-slate-700">未找到符合条件的账本流水明细</p>
          <p className="text-xs text-slate-400">可以清除筛选条件，或在“记账开单”中录入一笔</p>
          <button
            onClick={onNavigateToEntry}
            className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
          >
            去记账
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 桌面端大屏幕表格视图 */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">单号 / 记账日期</th>
                    <th className="py-3 px-4 font-semibold">类型 / 分类</th>
                    <th className="py-3 px-4 font-semibold">对方 / 经手</th>
                    <th className="py-3 px-4 font-semibold">做账收付明细</th>
                    <th className="py-3 px-4 font-semibold">汇率 / 利差毛利</th>
                    <th className="py-3 px-4 font-semibold">对应账户渠道</th>
                    <th className="py-3 px-4 font-semibold">核销状态</th>
                    <th className="py-3 px-4 font-semibold text-right">凭证与操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((tx) => {
                    const typeInfo = typeLabels[tx.type];
                    const statusInfo = statusLabels[tx.status];

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 单号与日期 */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-800">{tx.orderNo}</div>
                          <div className="text-[11px] text-slate-400">{tx.date || tx.createdAt?.slice(0, 10)}</div>
                        </td>

                        {/* 类型与分类 */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${typeInfo.bg} ${typeInfo.textCol} ${typeInfo.border}`}>
                            <span>{typeInfo.icon}</span>
                            <span>{typeInfo.text}</span>
                          </span>
                          {tx.category && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-0.5">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span>{tx.category}</span>
                            </div>
                          )}
                        </td>

                        {/* 对方与出纳 */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">
                            {tx.counterparty || <span className="text-slate-400">常规业务</span>}
                          </div>
                          {tx.contact && (
                            <div className="text-[11px] text-amber-700 font-mono">📱 {tx.contact}</div>
                          )}
                          {tx.operator && (
                            <div className="text-[11px] text-slate-400">出纳: {tx.operator}</div>
                          )}
                        </td>

                        {/* 做账金额明细 */}
                        <td className="py-3.5 px-4 font-mono">
                          {tx.type === 'EXCHANGE' ? (
                            <div>
                              <div className="font-bold text-slate-900">
                                收: {formatCurrency(tx.fromAmount || 0, tx.fromCurrency || 'CNY')}
                              </div>
                              <div className="text-slate-600 text-[11px]">
                                出: {formatCurrency(tx.toAmount || 0, tx.toCurrency || 'MMK')}
                              </div>
                            </div>
                          ) : tx.type === 'INCOME' ? (
                            <div className="font-bold text-emerald-600">
                              +{formatCurrency(tx.amount || 0, tx.currency || 'CNY')}
                            </div>
                          ) : (
                            <div className="font-bold text-rose-600">
                              -{formatCurrency(tx.amount || 0, tx.currency || 'CNY')}
                            </div>
                          )}
                        </td>

                        {/* 汇率与利润 */}
                        <td className="py-3.5 px-4 font-mono">
                          {tx.type === 'EXCHANGE' ? (
                            <div>
                              <div className="font-bold text-slate-800">1 : {tx.rate}</div>
                              <div className="text-emerald-700 font-semibold text-[11px]">
                                利差毛利: +¥{formatCNY(tx.profitEstimated || 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[11px]">
                              {tx.note || '-'}
                            </div>
                          )}
                        </td>

                        {/* 渠道 */}
                        <td className="py-3.5 px-4">
                          {tx.type === 'EXCHANGE' ? (
                            <div className="text-[11px] space-y-0.5">
                              <div className="text-slate-700 truncate max-w-[140px]">
                                入: {channelLabels[tx.inChannel || 'Other']?.label}
                              </div>
                              <div className="text-slate-500 truncate max-w-[140px]">
                                出: {channelLabels[tx.outChannel || 'Other']?.label}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-700 truncate max-w-[140px]">
                              {channelLabels[tx.channel || 'Other']?.label}
                            </div>
                          )}
                        </td>

                        {/* 状态 */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}>
                            {statusInfo.text}
                          </span>
                        </td>

                        {/* 操作 */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.status !== 'COMPLETED' && (
                              <button
                                onClick={() => onUpdateStatus(tx.id, 'COMPLETED')}
                                title="核销并确认完全结清"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenReceipt(tx)}
                              title="查看/打印记账凭单"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`确认作废并删除单号为 ${tx.orderNo} 的流水记录吗？`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              title="作废删除"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 移动端手机卡片式流水列表 */}
          <div className="md:hidden space-y-3">
            {filteredList.map((tx) => {
              const typeInfo = typeLabels[tx.type];
              const statusInfo = statusLabels[tx.status];

              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  {/* 头部：单号与类型标签 */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${typeInfo.bg} ${typeInfo.textCol} ${typeInfo.border}`}>
                        {typeInfo.text}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-800">{tx.orderNo}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* 核心金额与分类 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {tx.counterparty || '常规收支'}
                      </div>
                      {tx.contact && (
                        <div className="text-[11px] text-amber-700 font-mono">
                          📱 {tx.contact}
                        </div>
                      )}
                      {tx.category && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {tx.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      {tx.type === 'EXCHANGE' ? (
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            收: {formatCurrency(tx.fromAmount || 0, tx.fromCurrency || 'CNY')}
                          </div>
                          <div className="text-[11px] text-emerald-600">
                            付: {formatCurrency(tx.toAmount || 0, tx.toCurrency || 'MMK')}
                          </div>
                        </div>
                      ) : tx.type === 'INCOME' ? (
                        <div className="text-sm font-bold text-emerald-600">
                          +{formatCurrency(tx.amount || 0, tx.currency || 'CNY')}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-rose-600">
                          -{formatCurrency(tx.amount || 0, tx.currency || 'CNY')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 汇率与渠道补充信息 */}
                  {tx.type === 'EXCHANGE' && (
                    <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs font-mono">
                      <span>成交汇率: <strong>1:{tx.rate}</strong></span>
                      <span className="text-emerald-700 font-bold">毛利: +¥{formatCNY(tx.profitEstimated || 0)}</span>
                    </div>
                  )}

                  {tx.note && (
                    <div className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg">
                      备注: {tx.note}
                    </div>
                  )}

                  {/* 底部操作条 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{tx.date || tx.createdAt?.slice(0, 10)} {tx.operator && `· ${tx.operator}`}</span>
                    <div className="flex items-center gap-2">
                      {tx.status !== 'COMPLETED' && (
                        <button
                          onClick={() => onUpdateStatus(tx.id, 'COMPLETED')}
                          className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>结清</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenReceipt(tx)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-medium"
                      >
                        <FileText className="w-3 h-3" />
                        <span>凭单</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`确认作废删除流水单 ${tx.orderNo} 吗？`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

