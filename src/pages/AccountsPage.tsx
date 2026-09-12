import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  ArrowRightLeft, 
  Plus, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  Building
} from 'lucide-react';
import { BankAccount, Currency, ExchangeRateConfig, PaymentChannel } from '../types';
import { channelLabels, formatCNY, formatCurrency, formatMMK } from '../lib/storage';

interface AccountsPageProps {
  accounts: BankAccount[];
  rates: ExchangeRateConfig;
  onUpdateAccount: (updatedAccount: BankAccount) => void;
  onAddAccount: (newAccount: BankAccount) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  rates,
  onUpdateAccount,
  onAddAccount,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | Currency>('ALL');
  
  // 资金调拨模态框
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // 余额调整/盘点模态框
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // 新增账户模态框
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState<Currency>('MMK');
  const [newAccChannel, setNewAccChannel] = useState<PaymentChannel>('KBZPay');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccHolder, setNewAccHolder] = useState('');
  const [newAccInitBalance, setNewAccInitBalance] = useState('0');

  // 计算两币种资金池总额
  const totals = useMemo(() => {
    let mmkTotal = 0;
    let cnyTotal = 0;

    accounts.forEach((acc) => {
      if (!acc.isActive) return;
      if (acc.currency === 'MMK') {
        mmkTotal += acc.balance;
      } else {
        cnyTotal += acc.balance;
      }
    });

    // 折合总人民币资产 (按当前基准价 rates.marketBenchmark 计算)
    const mmkConvertedToCny = rates.marketBenchmark > 0 ? mmkTotal / rates.marketBenchmark : 0;
    const totalAssetInCNY = cnyTotal + mmkConvertedToCny;

    return { mmkTotal, cnyTotal, totalAssetInCNY };
  }, [accounts, rates]);

  // 筛选显示的账户
  const displayAccounts = accounts.filter(
    (acc) => selectedCurrency === 'ALL' || acc.currency === selectedCurrency
  );

  // 执行资金调拨 (同一币种账户间划转)
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的调拨金额');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('转出账户与转入账户不能相同');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);

    if (!fromAcc || !toAcc) return;

    if (fromAcc.currency !== toAcc.currency) {
      alert('不同币种间的划转请直接通过“换汇开单”进行做账登记');
      return;
    }

    if (fromAcc.balance < amount) {
      if (!confirm(`转出账户余额不足（当前余额：${fromAcc.balance}），是否继续强制记账？`)) {
        return;
      }
    }

    // 更新两个账户余额
    onUpdateAccount({
      ...fromAcc,
      balance: fromAcc.balance - amount,
    });
    onUpdateAccount({
      ...toAcc,
      balance: toAcc.balance + amount,
    });

    setShowTransferModal(false);
    setTransferAmount('');
    setTransferNote('');
    alert(`已完成资金调拨：从 [${fromAcc.name}] 调出并转入 [${toAcc.name}]`);
  };

  // 执行余额盘点更新
  const handleSaveBalanceAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum)) {
      alert('请输入有效金额');
      return;
    }

    onUpdateAccount({
      ...editingAccount,
      balance: balanceNum,
    });

    setEditingAccount(null);
    setNewBalance('');
    setAdjustReason('');
  };

  // 新增账户
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      alert('请输入账户名称');
      return;
    }

    const created: BankAccount = {
      id: `acc_${Date.now()}`,
      name: newAccName.trim(),
      currency: newAccCurrency,
      channel: newAccChannel,
      accountNumber: newAccNumber.trim(),
      accountHolder: newAccHolder.trim(),
      balance: parseFloat(newAccInitBalance) || 0,
      isActive: true,
    };

    onAddAccount(created);
    setShowAddModal(false);
    setNewAccName('');
    setNewAccNumber('');
    setNewAccHolder('');
    setNewAccInitBalance('0');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 顶部资金池大盘 */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              <span>中缅资金池实时盘点</span>
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-1">资金账户与金库管理</h2>
          </div>

          {/* 快捷按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowTransferModal(true);
                const first = accounts.filter(a => a.currency === 'MMK');
                if (first.length >= 2) {
                  setFromAccountId(first[0]?.id || '');
                  setToAccountId(first[1]?.id || '');
                } else if (accounts.length >= 2) {
                  setFromAccountId(accounts[0]?.id || '');
                  setToAccountId(accounts[1]?.id || '');
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>账户资金调拨</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>添加新账户</span>
            </button>
          </div>
        </div>

        {/* 核心双币种盘面数据 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* 缅币资金池 */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>🇲🇲 缅币资金池合计 (MMK)</span>
              <span className="text-emerald-400 font-medium">KBZ / Wave / 现钞</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatMMK(totals.mmkTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              约合 {totals.mmkTotal >= 100000000 ? `${(totals.mmkTotal / 100000000).toFixed(2)} 亿 MMK` : `${(totals.mmkTotal / 10000).toFixed(0)} 万 MMK`}
            </div>
          </div>

          {/* 人民币资金池 */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>🇨🇳 人民币资金池合计 (CNY)</span>
              <span className="text-sky-400 font-medium">微信 / 支付宝 / 银联</span>
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              ¥ {formatCNY(totals.cnyTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              约合 {(totals.cnyTotal / 10000).toFixed(2)} 万元人民币
            </div>
          </div>

          {/* 折合总资产 */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>🌐 双币折合总本金 (估值)</span>
              <span className="text-amber-400 font-medium">参考汇率 1:{rates.marketBenchmark}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              ¥ {formatCNY(totals.totalAssetInCNY)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              按市场中间价折算总资产净值
            </div>
          </div>
        </div>
      </div>

      {/* 币种过滤标签 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedCurrency('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedCurrency === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部账户 ({accounts.length})
          </button>
          <button
            onClick={() => setSelectedCurrency('MMK')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedCurrency === 'MMK' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇲🇲 缅币账户 ({accounts.filter(a => a.currency === 'MMK').length})
          </button>
          <button
            onClick={() => setSelectedCurrency('CNY')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedCurrency === 'CNY' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇨🇳 人民币账户 ({accounts.filter(a => a.currency === 'CNY').length})
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          可直接对任意账户点击“平账盘点”修正当前余额
        </span>
      </div>

      {/* 账户卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayAccounts.map((acc) => {
          const channelInfo = channelLabels[acc.channel] || channelLabels.Other;
          const isMmk = acc.currency === 'MMK';
          return (
            <div
              key={acc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{channelInfo.flag}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{acc.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {channelInfo.label}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${channelInfo.badgeClass}`}>
                    {acc.currency}
                  </span>
                </div>

                {/* 账号信息 */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>账号/号码:</span>
                    <span className="font-mono text-slate-800 font-semibold">{acc.accountNumber || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>户名/负责人:</span>
                    <span className="text-slate-800 font-medium">{acc.accountHolder || '—'}</span>
                  </div>
                </div>

                {/* 当前余额大字 */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">当前可用做账余额:</span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${isMmk ? 'text-emerald-700' : 'text-sky-700'}`}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-600 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  正常在账
                </span>

                <button
                  onClick={() => {
                    setEditingAccount(acc);
                    setNewBalance(acc.balance.toString());
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  平账盘点
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 调拨模态框 */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <span>同币种账户资金调拨</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">转出账户 (付款方):</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.currency}] {a.name} (余额: {formatCurrency(a.balance, a.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">转入账户 (收款方):</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.currency}] {a.name} (余额: {formatCurrency(a.balance, a.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">划转金额:</label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900"
                  placeholder="请输入转账金额"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">调拨备注 / 凭证说明:</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="例如: 支付宝提现至工行，或 KPay 柜台取现"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs"
                >
                  确认划转调拨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 平账盘点模态框 */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                账户余额盘点: {editingAccount.name}
              </h3>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalanceAdjust} className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">当前记录账面余额:</span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {formatCurrency(editingAccount.balance, editingAccount.currency)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  盘点后实际最新余额 ({editingAccount.currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">平账原因备注:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  placeholder="例如: 日结盘点少钞、银行利息入账等"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  保存更新余额
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增账户模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>添加新资金账户</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">账户显示名称 <span className="text-rose-500">*</span>:</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  placeholder="如: KBZPay 3号收款号 / 招商银行卡"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">币种:</label>
                  <select
                    value={newAccCurrency}
                    onChange={(e) => setNewAccCurrency(e.target.value as Currency)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="MMK">🇲🇲 缅甸元 (MMK)</option>
                    <option value="CNY">🇨🇳 人民币 (CNY)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">渠道类型:</label>
                  <select
                    value={newAccChannel}
                    onChange={(e) => setNewAccChannel(e.target.value as PaymentChannel)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="KBZPay">KBZPay</option>
                    <option value="WaveMoney">WaveMoney</option>
                    <option value="AYA_Bank">AYA Bank</option>
                    <option value="CB_Bank">CB Bank</option>
                    <option value="MMK_Cash">缅币现金</option>
                    <option value="WeChat_Pay">微信支付</option>
                    <option value="Alipay">支付宝</option>
                    <option value="China_Bank">国内银行卡</option>
                    <option value="CNY_Cash">人民币现金</option>
                    <option value="Other">其他</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">卡号 / 手机号:</label>
                  <input
                    type="text"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="如: 09-xxxxxxx"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">户名负责人:</label>
                  <input
                    type="text"
                    value={newAccHolder}
                    onChange={(e) => setNewAccHolder(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    placeholder="持卡人姓名"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">初始在账金额:</label>
                <input
                  type="number"
                  value={newAccInitBalance}
                  onChange={(e) => setNewAccInitBalance(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  placeholder="0"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  确定创建账户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
