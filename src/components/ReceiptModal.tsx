import React, { useState } from 'react';
import { Check, Copy, Printer, X, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { Transaction } from '../types';
import { channelLabels, formatCurrency, formatCNY, statusLabels, typeLabels } from '../lib/storage';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const isExchange = transaction.type === 'EXCHANGE';
  const isIncome = transaction.type === 'INCOME';
  const isExpense = transaction.type === 'EXPENSE';
  const isCnyToMmk = transaction.direction === 'CNY_TO_MMK';
  const statusInfo = statusLabels[transaction.status] || { text: '已记账', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' };
  const typeInfo = typeLabels[transaction.type] || { text: '记账凭单', icon: '📝' };

  // 生成发给对账人的文本
  const generateVoucherText = () => {
    let contentLines: string[] = [];

    if (isExchange) {
      contentLines = [
        `业务类型: 换汇记账 (${isCnyToMmk ? '收CNY出MMK' : '收MMK出CNY'})`,
        `成交汇率: 1 CNY = ${transaction.rate} MMK`,
        `我方收款: ${formatCurrency(transaction.fromAmount || 0, transaction.fromCurrency || 'CNY')} (${channelLabels[transaction.inChannel || 'Other']?.label || ''})`,
        `我方出款: ${formatCurrency(transaction.toAmount || 0, transaction.toCurrency || 'MMK')} (${channelLabels[transaction.outChannel || 'Other']?.label || ''})`,
        `利差预估: +¥${transaction.profitEstimated || 0}`,
      ];
    } else {
      contentLines = [
        `记账类型: ${typeInfo.text}`,
        `业务分类: ${transaction.category || '-'}`,
        `金额币种: ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount || 0, transaction.currency || 'CNY')}`,
        `结算渠道: ${channelLabels[transaction.channel || 'Other']?.label || ''}`,
      ];
    }

    const lines = [
      `=============================`,
      `【缅中换汇系统记账凭单】`,
      `单据编号: ${transaction.orderNo}`,
      `记账日期: ${transaction.date || transaction.createdAt?.slice(0, 10)}`,
      `对方/经手: ${transaction.counterparty || '常规收支'}`,
      `-----------------------------`,
      ...contentLines,
      `核销状态: ${statusInfo.text}`,
      transaction.note ? `业务备注: ${transaction.note}` : '',
      `经办出纳: ${transaction.operator || '系统管理员'}`,
      `=============================`,
      `* 该凭证由缅中换汇做账系统自动生成，已入账备查。`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateVoucherText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* 标题栏 */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm">
              FX
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span>缅中记账凭单</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                  {typeInfo.text}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">NO: {transaction.orderNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 凭证可打印区域 */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-800 space-y-4 print:p-0 print:m-0" id="printable-voucher">
          {/* 单据日期与状态 */}
          <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
            <div>
              <span className="text-xs text-slate-400">记账时间</span>
              <p className="text-xs font-semibold text-slate-700">
                {transaction.date || transaction.createdAt?.slice(0, 10)} {transaction.createdAt?.slice(11, 16)}
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}>
              {statusInfo.text}
            </div>
          </div>

          {/* 换汇业务核心金额看板 */}
          {isExchange && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>换汇方向</span>
                <span className="font-medium text-slate-800">
                  {isCnyToMmk ? '🇨🇳 收人民币 ➔ 🇲🇲 出缅币' : '🇲🇲 收缅币 ➔ 🇨🇳 出人民币'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 items-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">我方收款</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900 block">
                    {formatCurrency(transaction.fromAmount || 0, transaction.fromCurrency || 'CNY')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                    {channelLabels[transaction.inChannel || 'Other']?.label}
                  </span>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <span className="text-[11px] text-slate-400 block">我方出款</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-emerald-600 block">
                    {formatCurrency(transaction.toAmount || 0, transaction.toCurrency || 'MMK')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                    {channelLabels[transaction.outChannel || 'Other']?.label}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">成交单价:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  1 CNY = {transaction.rate} MMK
                </span>
              </div>
            </div>
          )}

          {/* 日常收支金额看板 */}
          {!isExchange && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs text-slate-500 block">记账收支金额</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount || 0, transaction.currency || 'CNY')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">结算账户:</span>
                <span className="font-semibold text-slate-800">
                  {channelLabels[transaction.channel || 'Other']?.label}
                </span>
              </div>
            </div>
          )}

          {/* 明细项 */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">对方名称/经手:</span>
              <span className="font-semibold text-slate-800">{transaction.counterparty || '常规往来'}</span>
            </div>

            {transaction.category && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">做账科目分类:</span>
                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {transaction.category}
                </span>
              </div>
            )}

            {transaction.inAccountInfo && (
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">入款流水备注:</span>
                <span className="font-mono text-slate-700 text-right">{transaction.inAccountInfo}</span>
              </div>
            )}

            {transaction.outAccountInfo && (
              <div className="flex items-start justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">出款流水备注:</span>
                <span className="font-mono text-slate-800 font-medium text-right">{transaction.outAccountInfo}</span>
              </div>
            )}

            {transaction.note && (
              <div className="py-1">
                <span className="text-slate-500 block mb-0.5">做账附注:</span>
                <p className="bg-amber-50/50 p-2 rounded text-slate-700 text-xs border border-amber-100">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>

          {/* 底部防伪凭证标识 */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
            <div className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>记账凭单已存底</span>
            </div>
            <span>经手出纳: {transaction.operator || '系统出纳'}</span>
          </div>
        </div>

        {/* 底部按钮条 */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>已复制凭单文本</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>复制凭单文本</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">打印凭单</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

