import React, { useState, useId } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Sparkles,
  Receipt,
  FileText,
  AlertCircle,
  Tag,
  Wallet,
  RotateCcw
} from 'lucide-react';
import { 
  BankAccount, 
  Currency, 
  DailyRateRecord,
  ExchangeDirection, 
  ExchangeRateConfig, 
  PaymentChannel, 
  SettlementStatus, 
  Transaction, 
  TransactionType 
} from '../types';
import { formatCNY, formatCurrency, formatMMK } from '../lib/storage';
import { initialIncomeCategories, initialExpenseCategories } from '../data/mockData';

interface BookkeepingEntryPageProps {
  rates: ExchangeRateConfig;
  accounts: BankAccount[];
  incomeCategories?: string[];
  expenseCategories?: string[];
  onAddTransaction: (tx: Transaction) => void;
  onOpenReceipt?: (tx: Transaction) => void;
  onSaveDailyRate?: (record: DailyRateRecord) => void;
  onNavigateToLedger?: () => void;
}

export const BookkeepingEntryPage: React.FC<BookkeepingEntryPageProps> = ({
  rates,
  accounts,
  incomeCategories = initialIncomeCategories,
  expenseCategories = initialExpenseCategories,
  onAddTransaction,
  onOpenReceipt,
  onSaveDailyRate,
  onNavigateToLedger,
}) => {
  // 记账类型模式: 换汇 / 收入 / 支出
  const [entryType, setEntryType] = useState<TransactionType>('EXCHANGE');

  // ================= 换汇做账表单状态 =================
  const [exchangeDirection, setExchangeDirection] = useState<ExchangeDirection>('CNY_TO_MMK');
  const [cnyAmount, setCnyAmount] = useState<string>('10000');
  const [mmkAmount, setMmkAmount] = useState<string>('');
  const [rateInput, setRateInput] = useState<string>(() => (rates?.cnyToMmkSell ?? 610).toString());
  const [costRateInput, setCostRateInput] = useState<string>(() => (rates?.costCnyToMmk ?? 614.5).toString());
  const [activeInput, setActiveInput] = useState<'CNY' | 'MMK'>('CNY');
  const [fxInAccountId, setFxInAccountId] = useState<string>('');
  const [fxOutAccountId, setFxOutAccountId] = useState<string>('');
  const [fxCounterparty, setFxCounterparty] = useState<string>('');
  const [fxNote, setFxNote] = useState<string>('');
  const [fxFee, setFxFee] = useState<string>('0');
  const [fxOperator, setFxOperator] = useState<string>('张主管');
  const [fxStatus, setFxStatus] = useState<SettlementStatus>('COMPLETED');

  // ================= 收入与支出表单状态 =================
  const [incExpCurrency, setIncExpCurrency] = useState<Currency>('CNY');
  const [incExpAmount, setIncExpAmount] = useState<string>('');
  const [incCategory, setIncCategory] = useState<string>(() => (incomeCategories?.[0] || '换汇利润'));
  const [expCategory, setExpCategory] = useState<string>(() => (expenseCategories?.[0] || '房租与物业费'));
  const [incExpAccountId, setIncExpAccountId] = useState<string>('');
  const [incExpCounterparty, setIncExpCounterparty] = useState<string>('');
  const [incExpDate, setIncExpDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incExpNote, setIncExpNote] = useState<string>('');
  const [incExpOperator, setIncExpOperator] = useState<string>('李出纳');

  // 成功提示弹窗
  const [successToast, setSuccessToast] = useState<{ 
    show: boolean; 
    msg: string; 
    orderNo: string;
    tx?: Transaction;
  }>({
    show: false,
    msg: '',
    orderNo: '',
  });

  // 自动根据今日汇率初始化
  React.useEffect(() => {
    if (exchangeDirection === 'CNY_TO_MMK') {
      setRateInput((rates?.cnyToMmkSell ?? 610).toString());
      setCostRateInput((rates?.costCnyToMmk ?? 614.5).toString());
    } else {
      setRateInput((rates?.mmkToCnyBuy ?? 620).toString());
      setCostRateInput((rates?.costMmkToCny ?? 613.5).toString());
    }
  }, [exchangeDirection, rates]);

  // 根据金额和汇率联动计算
  React.useEffect(() => {
    const rate = parseFloat(rateInput);
    if (!rate || rate <= 0) return;

    if (activeInput === 'CNY') {
      const cny = parseFloat(cnyAmount);
      if (!isNaN(cny)) {
        const mmk = Math.round(cny * rate);
        setMmkAmount(mmk.toString());
      } else {
        setMmkAmount('');
      }
    } else {
      const mmk = parseFloat(mmkAmount);
      if (!isNaN(mmk)) {
        const cny = parseFloat((mmk / rate).toFixed(2));
        setCnyAmount(cny.toString());
      } else {
        setCnyAmount('');
      }
    }
  }, [cnyAmount, mmkAmount, rateInput, activeInput]);

  // 切换换汇方向
  const handleToggleDirection = () => {
    const nextDir = exchangeDirection === 'CNY_TO_MMK' ? 'MMK_TO_CNY' : 'CNY_TO_MMK';
    setExchangeDirection(nextDir);
    if (nextDir === 'CNY_TO_MMK') {
      setRateInput(rates.cnyToMmkSell.toString());
      setCostRateInput(rates.costCnyToMmk.toString());
    } else {
      setRateInput(rates.mmkToCnyBuy.toString());
      setCostRateInput(rates.costMmkToCny.toString());
    }
  };

  // 计算换汇预估毛利
  const calculateFxProfit = () => {
    const rate = parseFloat(rateInput) || 0;
    const cost = parseFloat(costRateInput) || rate;
    const cny = parseFloat(cnyAmount) || 0;
    const fee = parseFloat(fxFee) || 0;

    if (rate <= 0 || cost <= 0 || cny <= 0) return fee;

    let profit = 0;
    if (exchangeDirection === 'CNY_TO_MMK') {
      // 卖出MMK (底价进MMK高，卖出汇率低，利差为 cost - rate)
      const mmkGiven = cny * rate;
      const mmkCostEquivalentInCNY = mmkGiven / cost;
      profit = cny - mmkCostEquivalentInCNY;
    } else {
      // 买入MMK (买入汇率高如620，平仓出款成本如613.5)
      const mmkReceived = cny * rate;
      const cnyPaid = cny;
      const mmkActualValueInCNY = mmkReceived / cost;
      profit = mmkActualValueInCNY - cnyPaid;
    }
    return Math.round((profit + fee) * 100) / 100;
  };

  // 筛选账户选项
  const cnyAccounts = accounts.filter(a => a.currency === 'CNY' && a.isActive);
  const mmkAccounts = accounts.filter(a => a.currency === 'MMK' && a.isActive);

  // 提交换汇账单
  const handleFxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cny = parseFloat(cnyAmount);
    const mmk = parseFloat(mmkAmount);
    const rate = parseFloat(rateInput);
    const costRate = parseFloat(costRateInput);
    const fee = parseFloat(fxFee) || 0;

    if (!cny || !mmk || !rate || cny <= 0 || mmk <= 0) {
      alert('请完整填写换汇金额与汇率');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const orderNo = `FX${Date.now().toString().slice(-8)}`;

    const fromAmount = exchangeDirection === 'CNY_TO_MMK' ? cny : mmk;
    const fromCurrency: Currency = exchangeDirection === 'CNY_TO_MMK' ? 'CNY' : 'MMK';
    const toAmount = exchangeDirection === 'CNY_TO_MMK' ? mmk : cny;
    const toCurrency: Currency = exchangeDirection === 'CNY_TO_MMK' ? 'MMK' : 'CNY';

    const inAcc = accounts.find(a => a.id === fxInAccountId);
    const outAcc = accounts.find(a => a.id === fxOutAccountId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orderNo,
      type: 'EXCHANGE',
      createdAt: new Date().toISOString(),
      date: todayStr,
      direction: exchangeDirection,
      fromAmount,
      fromCurrency,
      toAmount,
      toCurrency,
      rate,
      costRate: isNaN(costRate) ? undefined : costRate,
      fee,
      profitEstimated: calculateFxProfit(),
      inChannel: inAcc?.channel || (exchangeDirection === 'CNY_TO_MMK' ? 'WeChat_Pay' : 'KBZPay'),
      inAccountId: fxInAccountId || undefined,
      inAccountInfo: inAcc?.name || '默认收方账户',
      outChannel: outAcc?.channel || (exchangeDirection === 'CNY_TO_MMK' ? 'KBZPay' : 'China_Bank'),
      outAccountId: fxOutAccountId || undefined,
      outAccountInfo: outAcc?.name || '默认付方账户',
      status: fxStatus,
      counterparty: fxCounterparty.trim() || undefined,
      note: fxNote.trim() || undefined,
      operator: fxOperator.trim() || '出纳',
    };

    onAddTransaction(newTx);
    setSuccessToast({
      show: true,
      msg: `换汇开单记账成功！单号: ${orderNo}`,
      orderNo,
      tx: newTx,
    });
    setFxNote('');
    setFxCounterparty('');
    setTimeout(() => {
      setSuccessToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 提交日常收入记账
  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(incExpAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的收入金额');
      return;
    }

    const orderNo = `INC${Date.now().toString().slice(-8)}`;
    const targetAcc = accounts.find(a => a.id === incExpAccountId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orderNo,
      type: 'INCOME',
      createdAt: new Date().toISOString(),
      date: incExpDate || new Date().toISOString().split('T')[0],
      amount,
      currency: incExpCurrency,
      category: incCategory,
      accountId: incExpAccountId || undefined,
      channel: targetAcc?.channel || (incExpCurrency === 'CNY' ? 'WeChat_Pay' : 'KBZPay'),
      counterparty: incExpCounterparty.trim() || undefined,
      status: 'COMPLETED',
      note: incExpNote.trim() || undefined,
      operator: incExpOperator.trim() || '李出纳',
    };

    onAddTransaction(newTx);
    setSuccessToast({
      show: true,
      msg: `收入记账成功！入账: ${formatCurrency(amount, incExpCurrency)}`,
      orderNo,
      tx: newTx,
    });
    setIncExpAmount('');
    setIncExpNote('');
    setIncExpCounterparty('');
    setTimeout(() => {
      setSuccessToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 提交日常支出记账
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(incExpAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的支出金额');
      return;
    }

    const orderNo = `EXP${Date.now().toString().slice(-8)}`;
    const targetAcc = accounts.find(a => a.id === incExpAccountId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      orderNo,
      type: 'EXPENSE',
      createdAt: new Date().toISOString(),
      date: incExpDate || new Date().toISOString().split('T')[0],
      amount,
      currency: incExpCurrency,
      category: expCategory,
      accountId: incExpAccountId || undefined,
      channel: targetAcc?.channel || (incExpCurrency === 'CNY' ? 'China_Bank' : 'KBZPay'),
      counterparty: incExpCounterparty.trim() || undefined,
      status: 'COMPLETED',
      note: incExpNote.trim() || undefined,
      operator: incExpOperator.trim() || '张主管',
    };

    onAddTransaction(newTx);
    setSuccessToast({
      show: true,
      msg: `支出记账成功！出账: ${formatCurrency(amount, incExpCurrency)}`,
      orderNo,
      tx: newTx,
    });
    setIncExpAmount('');
    setIncExpNote('');
    setIncExpCounterparty('');
    setTimeout(() => {
      setSuccessToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* 顶部做账业务类型切换栏 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            id="tab-btn-exchange"
            onClick={() => setEntryType('EXCHANGE')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              entryType === 'EXCHANGE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>换汇开单记账</span>
          </button>

          <button
            type="button"
            id="tab-btn-income"
            onClick={() => setEntryType('INCOME')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              entryType === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>日常收入记账</span>
          </button>

          <button
            type="button"
            id="tab-btn-expense"
            onClick={() => setEntryType('EXPENSE')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              entryType === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>日常支出记账</span>
          </button>
        </div>
      </div>

      {/* 成功记账横幅提示 */}
      {successToast.show && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successToast.msg}</span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenReceipt && successToast.tx && (
              <button
                type="button"
                onClick={() => onOpenReceipt(successToast.tx!)}
                className="text-xs font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>开单回执与凭证</span>
              </button>
            )}
            {onNavigateToLedger && (
              <button
                type="button"
                onClick={onNavigateToLedger}
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
              >
                前往流水账本查看 →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================= 模式 1: 换汇开单记账 ======================= */}
      {entryType === 'EXCHANGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧主要开单算价表单 */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                  <span>中缅换汇交易录入</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  输入兑换金额与手动实时汇率，系统自动算价与计算毛利
                </p>
              </div>

              {/* 换汇方向切换 */}
              <button
                type="button"
                id="btn-switch-fx-direction"
                onClick={handleToggleDirection}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 text-xs sm:text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
              >
                <span>{exchangeDirection === 'CNY_TO_MMK' ? '🇨🇳 人民币 → 🇲🇲 缅币' : '🇲🇲 缅币 → 🇨🇳 人民币'}</span>
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleFxSubmit} className="space-y-6">
              {/* 金额与汇率核心网格 */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                {/* 人民币金额 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="text-base">🇨🇳</span> 人民币金额 (CNY)
                      {exchangeDirection === 'CNY_TO_MMK' && (
                        <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          我方收入人民币
                        </span>
                      )}
                      {exchangeDirection === 'MMK_TO_CNY' && (
                        <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          我方付给客户
                        </span>
                      )}
                    </label>
                    <div className="flex gap-1">
                      {['5000', '10000', '50000', '100000'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setActiveInput('CNY');
                            setCnyAmount(val);
                          }}
                          className="text-[11px] px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-700 font-mono transition-colors"
                        >
                          ¥{parseInt(val) >= 10000 ? `${parseInt(val)/10000}万` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-lg">¥</span>
                    <input
                      type="number"
                      id="input-cny-amount"
                      step="any"
                      required
                      value={cnyAmount}
                      onChange={(e) => {
                        setActiveInput('CNY');
                        setCnyAmount(e.target.value);
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-16 py-2.5 text-lg sm:text-xl font-bold font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                      CNY 元
                    </span>
                  </div>
                </div>

                {/* 手动成交汇率控制条 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>成交汇率 (1 CNY =)</span>
                        <span className="text-rose-500">*手动输入</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRateInput(
                            exchangeDirection === 'CNY_TO_MMK'
                              ? rates.cnyToMmkSell.toString()
                              : rates.mmkToCnyBuy.toString()
                          );
                        }}
                        className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        今日基准: {exchangeDirection === 'CNY_TO_MMK' ? rates.cnyToMmkSell : rates.mmkToCnyBuy}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(rateInput) || 0;
                          setRateInput((val - 0.5).toFixed(1));
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        id="input-manual-rate"
                        step="0.1"
                        required
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        className="w-full text-center py-1.5 font-mono font-black text-amber-600 text-base bg-amber-50/50 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(rateInput) || 0;
                          setRateInput((val + 0.5).toFixed(1));
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 text-center">
                      每 10,000 元人民币折合: {formatMMK((parseFloat(rateInput) || 0) * 10000)} MMK
                    </div>
                  </div>

                  {/* 成本参考汇率 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        进价底价成本 (算利差)
                      </label>
                      <span className="text-[10px] text-slate-400">仅用于做账毛利</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-cost-rate"
                        step="0.1"
                        value={costRateInput}
                        onChange={(e) => setCostRateInput(e.target.value)}
                        className="w-full py-2 px-3 font-mono font-semibold text-slate-700 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                        placeholder="如: 614.5"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">MMK</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      利差空间: {(Math.abs((parseFloat(rateInput) || 0) - (parseFloat(costRateInput) || 0))).toFixed(1)} 点
                    </div>
                  </div>
                </div>

                {/* 缅币金额 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="text-base">🇲🇲</span> 缅币金额 (MMK)
                      {exchangeDirection === 'CNY_TO_MMK' && (
                        <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          我方付给客户
                        </span>
                      )}
                      {exchangeDirection === 'MMK_TO_CNY' && (
                        <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          我方收入缅币
                        </span>
                      )}
                    </label>
                    <div className="flex gap-1">
                      {['10000000', '30000000', '50000000'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setActiveInput('MMK');
                            setMmkAmount(val);
                          }}
                          className="text-[11px] px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-700 font-mono transition-colors"
                        >
                          {parseInt(val) / 10000}万
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">Ks</span>
                    <input
                      type="number"
                      id="input-mmk-amount"
                      step="1"
                      required
                      value={mmkAmount}
                      onChange={(e) => {
                        setActiveInput('MMK');
                        setMmkAmount(e.target.value);
                      }}
                      placeholder="0"
                      className="w-full pl-10 pr-16 py-2.5 text-lg sm:text-xl font-bold font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                      MMK 缅币
                    </span>
                  </div>
                </div>
              </div>

              {/* 账户与收付信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 我方收款资金账户 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    入账账户 ({exchangeDirection === 'CNY_TO_MMK' ? '人民币入账' : '缅币入账'}):
                  </label>
                  <select
                    id="select-fx-in-account"
                    value={fxInAccountId}
                    onChange={(e) => setFxInAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- 选择收款资产账户 --</option>
                    {(exchangeDirection === 'CNY_TO_MMK' ? cnyAccounts : mmkAccounts).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (余额: {formatCurrency(acc.balance, acc.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 我方付款出账账户 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    出款账户 ({exchangeDirection === 'CNY_TO_MMK' ? '缅币出款' : '人民币出款'}):
                  </label>
                  <select
                    id="select-fx-out-account"
                    value={fxOutAccountId}
                    onChange={(e) => setFxOutAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- 选择出账资产账户 --</option>
                    {(exchangeDirection === 'CNY_TO_MMK' ? mmkAccounts : cnyAccounts).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (余额: {formatCurrency(acc.balance, acc.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 附加信息: 经手人、手续费、交易对方、备注 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    对方/客户备注名称:
                  </label>
                  <input
                    type="text"
                    id="input-fx-counterparty"
                    value={fxCounterparty}
                    onChange={(e) => setFxCounterparty(e.target.value)}
                    placeholder="如: 瓦城阿龙翡翠 / 个人散户"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    附加收付手续费 (CNY):
                  </label>
                  <input
                    type="number"
                    id="input-fx-fee"
                    step="any"
                    value={fxFee}
                    onChange={(e) => setFxFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    结清状态:
                  </label>
                  <select
                    id="select-fx-status"
                    value={fxStatus}
                    onChange={(e) => setFxStatus(e.target.value as SettlementStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="COMPLETED">✅ 已记账结清 (已双向出入款)</option>
                    <option value="PENDING">⏳ 待核销/在途 (待对方确认)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  业务备注与用途说明:
                </label>
                <input
                  type="text"
                  id="input-fx-note"
                  value={fxNote}
                  onChange={(e) => setFxNote(e.target.value)}
                  placeholder="如: 瓦城玉石公盘结算款 / 姐告边贸代购"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                id="btn-submit-fx-transaction"
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all transform active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>立即确认并记入账本</span>
              </button>
            </form>
          </div>

          {/* 右侧换汇做账摘要与毛利卡片 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-5">
              <h3 className="font-bold text-sm tracking-wide text-amber-400 uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                做账算价单明细
              </h3>

              <div className="space-y-3 font-mono text-xs border-b border-slate-800 pb-4">
                <div className="flex justify-between items-center text-slate-400">
                  <span>业务方向</span>
                  <span className="text-white font-bold">
                    {exchangeDirection === 'CNY_TO_MMK' ? '收 CNY → 付 MMK' : '收 MMK → 付 CNY'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>人民币规模</span>
                  <span className="text-emerald-400 font-bold">
                    ¥{formatCNY(parseFloat(cnyAmount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>缅币规模</span>
                  <span className="text-sky-400 font-bold">
                    {formatMMK(parseFloat(mmkAmount) || 0)} MMK
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>录入成交汇率</span>
                  <span className="text-amber-300 font-bold">
                    1 : {rateInput || '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>进价底价成本</span>
                  <span className="text-slate-300">
                    1 : {costRateInput || '0'}
                  </span>
                </div>
              </div>

              {/* 预估毛利突出展示 */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>换汇利差毛利润 (CNY预估)</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  +¥{formatCNY(calculateFxProfit())}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  折合缅币收益: ≈ {formatMMK(calculateFxProfit() * (parseFloat(rateInput) || 610))} MMK
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>每日汇率做账说明</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  中缅换汇行情每日波动，可在上方直接微调或在【每日汇率】中配置当日基准价。提交后自动联动多账户资产与全量明细账本。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 模式 2: 日常收入记账 ======================= */}
      {entryType === 'INCOME' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>录入日常营业收入</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                记录通道手续费、佣金分成、资金利息或其他经营收入
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              收入入账
            </span>
          </div>

          <form onSubmit={handleIncomeSubmit} className="space-y-5">
            {/* 币种与金额 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  收入币种:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncExpCurrency('CNY')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                      incExpCurrency === 'CNY'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🇨🇳 人民币 CNY
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncExpCurrency('MMK')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                      incExpCurrency === 'MMK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🇲🇲 缅币 MMK
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  入账金额 ({incExpCurrency}):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">
                    {incExpCurrency === 'CNY' ? '¥' : 'Ks'}
                  </span>
                  <input
                    type="number"
                    id="input-income-amount"
                    step="any"
                    required
                    value={incExpAmount}
                    onChange={(e) => setIncExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 font-mono font-bold text-lg bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 分类与收款账户 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  收入分类:
                </label>
                <select
                  id="select-income-category"
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                >
                  {(incomeCategories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  收款资产账户:
                </label>
                <select
                  id="select-income-account"
                  value={incExpAccountId}
                  onChange={(e) => setIncExpAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- 选择收款账户 --</option>
                  {accounts.filter(a => a.currency === incExpCurrency && a.isActive).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (余额: {formatCurrency(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 付款方、日期与经手人 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  付款方 / 来源说明:
                </label>
                <input
                  type="text"
                  id="input-income-counterparty"
                  value={incExpCounterparty}
                  onChange={(e) => setIncExpCounterparty(e.target.value)}
                  placeholder="如: 某合作钱庄 / 跨境电商"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  记账日期:
                </label>
                <input
                  type="date"
                  id="input-income-date"
                  value={incExpDate}
                  onChange={(e) => setIncExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  经手出纳:
                </label>
                <input
                  type="text"
                  id="input-income-operator"
                  value={incExpOperator}
                  onChange={(e) => setIncExpOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                备注说明:
              </label>
              <input
                type="text"
                id="input-income-note"
                value={incExpNote}
                onChange={(e) => setIncExpNote(e.target.value)}
                placeholder="详细备注信息..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-income-entry"
              className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>保存收入凭证并记入账本</span>
            </button>
          </form>
        </div>
      )}

      {/* ======================= 模式 3: 日常支出记账 ======================= */}
      {entryType === 'EXPENSE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-600" />
                <span>录入日常营业支出</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                记录店面房租、员工薪水提成、通道跨行转账手续费、水电杂费等
              </p>
            </div>
            <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
              支出出账
            </span>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-5">
            {/* 币种与金额 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  支出币种:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncExpCurrency('CNY')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                      incExpCurrency === 'CNY'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🇨🇳 人民币 CNY
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncExpCurrency('MMK')}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                      incExpCurrency === 'MMK'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🇲🇲 缅币 MMK
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  支出金额 ({incExpCurrency}):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">
                    {incExpCurrency === 'CNY' ? '¥' : 'Ks'}
                  </span>
                  <input
                    type="number"
                    id="input-expense-amount"
                    step="any"
                    required
                    value={incExpAmount}
                    onChange={(e) => setIncExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 font-mono font-bold text-lg bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 支出分类与付款账户 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  支出分类:
                </label>
                <select
                  id="select-expense-category"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                >
                  {(expenseCategories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  付款出账账户:
                </label>
                <select
                  id="select-expense-account"
                  value={incExpAccountId}
                  onChange={(e) => setIncExpAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- 选择付款账户 --</option>
                  {accounts.filter(a => a.currency === incExpCurrency && a.isActive).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (余额: {formatCurrency(acc.balance, acc.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 收款方、日期与经手人 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  收款方 / 对方经办人:
                </label>
                <input
                  type="text"
                  id="input-expense-counterparty"
                  value={incExpCounterparty}
                  onChange={(e) => setIncExpCounterparty(e.target.value)}
                  placeholder="如: 仰光房东 / 工商银行"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  记账日期:
                </label>
                <input
                  type="date"
                  id="input-expense-date"
                  value={incExpDate}
                  onChange={(e) => setIncExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  经手出纳:
                </label>
                <input
                  type="text"
                  id="input-expense-operator"
                  value={incExpOperator}
                  onChange={(e) => setIncExpOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                支出说明与凭证单号:
              </label>
              <input
                type="text"
                id="input-expense-note"
                value={incExpNote}
                onChange={(e) => setIncExpNote(e.target.value)}
                placeholder="如: 8月份仰光营业点月租 / 银行网银批量转账手续费"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-expense-entry"
              className="w-full py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>保存支出凭证并记入账本</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
