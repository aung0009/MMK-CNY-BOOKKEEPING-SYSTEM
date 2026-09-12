import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  BankAccount, 
  DailyRateRecord, 
  ExchangeRateConfig, 
  SettlementStatus, 
  Transaction 
} from './types';
import { 
  getStoredAccounts, 
  getStoredDailyRates, 
  getStoredExpenseCategories,
  getStoredIncomeCategories,
  getStoredRates, 
  getStoredTransactions, 
  saveStoredAccounts, 
  saveStoredDailyRates, 
  saveStoredRates, 
  saveStoredTransactions 
} from './lib/storage';
import { RateTickerBar } from './components/RateTickerBar';
import { Sidebar, MobileTabBar } from './components/Navigation';
import { ReceiptModal } from './components/ReceiptModal';
import { BookkeepingEntryPage } from './pages/BookkeepingEntryPage';
import { LedgerPage } from './pages/LedgerPage';
import { AccountsPage } from './pages/AccountsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RatesAndSettingsPage } from './pages/RatesAndSettingsPage';
import { 
  Plus, 
  Smartphone, 
  Monitor
} from 'lucide-react';

export default function App() {
  // 核心数据状态
  const [rates, setRates] = useState<ExchangeRateConfig>(() => getStoredRates());
  const [dailyRates, setDailyRates] = useState<DailyRateRecord[]>(() => getStoredDailyRates());
  const [accounts, setAccounts] = useState<BankAccount[]>(() => getStoredAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => getStoredIncomeCategories());
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => getStoredExpenseCategories());
  
  // 导航与页面状态 (5大独立页面: entry, ledger, report, accounts, settings)
  const [activeTab, setActiveTab] = useState<ActiveTab>('entry');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  // 手机模拟视图开关 (方便在电脑大屏上也能模拟手机单手体验)
  const [forceMobileView, setForceMobileView] = useState(false);

  // 同步至 localStorage
  useEffect(() => {
    saveStoredRates(rates);
  }, [rates]);

  useEffect(() => {
    saveStoredDailyRates(dailyRates);
  }, [dailyRates]);

  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  // 新增做账流水单据 (换汇 / 日常收入 / 日常支出)，并联动资金账户
  const handleAddTransaction = (newTx: Transaction) => {
    // 1. 追加流水记录
    const nextTxs = [newTx, ...transactions];
    setTransactions(nextTxs);

    // 2. 资金账户余额联动更新 (若处于 COMPLETED)
    if (newTx.status === 'COMPLETED') {
      const nextAccounts = accounts.map((acc) => {
        let balance = acc.balance;

        if (newTx.type === 'EXCHANGE') {
          // 我方收款入账
          if (acc.channel === newTx.inChannel) {
            balance += newTx.fromAmount || 0;
          }
          // 我方打款出账
          if (acc.channel === newTx.outChannel) {
            balance -= newTx.toAmount || 0;
          }
        } else if (newTx.type === 'INCOME') {
          if (acc.channel === newTx.channel) {
            balance += newTx.amount || 0;
          }
        } else if (newTx.type === 'EXPENSE') {
          if (acc.channel === newTx.channel) {
            balance -= newTx.amount || 0;
          }
        }

        return { ...acc, balance };
      });
      setAccounts(nextAccounts);
    }
  };

  // 更新交易状态 (如从待核销变为已结清)
  const handleUpdateTransactionStatus = (id: string, newStatus: SettlementStatus) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    // 如果从 PENDING 变为 COMPLETED，补扣/补入账户余额
    if (targetTx.status === 'PENDING' && newStatus === 'COMPLETED') {
      setAccounts((prev) =>
        prev.map((acc) => {
          let balance = acc.balance;
          if (targetTx.type === 'EXCHANGE') {
            if (acc.channel === targetTx.inChannel) balance += targetTx.fromAmount || 0;
            if (acc.channel === targetTx.outChannel) balance -= targetTx.toAmount || 0;
          } else if (targetTx.type === 'INCOME') {
            if (acc.channel === targetTx.channel) balance += targetTx.amount || 0;
          } else if (targetTx.type === 'EXPENSE') {
            if (acc.channel === targetTx.channel) balance -= targetTx.amount || 0;
          }
          return { ...acc, balance };
        })
      );
    }
  };

  // 删除/作废做账流水
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 更新单个账户
  const handleUpdateAccount = (updated: BankAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // 新增账户
  const handleAddAccount = (newAcc: BankAccount) => {
    setAccounts((prev) => [...prev, newAcc]);
  };

  // 重新加载所有数据 (导入或重置时使用)
  const handleReloadAllData = () => {
    setRates(getStoredRates());
    setDailyRates(getStoredDailyRates());
    setAccounts(getStoredAccounts());
    setTransactions(getStoredTransactions());
    setIncomeCategories(getStoredIncomeCategories());
    setExpenseCategories(getStoredExpenseCategories());
  };

  // 保存手工每日汇率记录
  const handleSaveDailyRate = (record: DailyRateRecord) => {
    setDailyRates((prev) => {
      const idx = prev.findIndex((r) => r.date === record.date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });
  };

  // 计算未结清/在途流水单数
  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col font-sans ${forceMobileView ? 'max-w-md mx-auto shadow-2xl border-x border-slate-300 min-h-screen relative' : ''}`}>
      {/* 顶部每日实时汇率走马灯与手工输入快捷入口 */}
      <RateTickerBar 
        rates={rates} 
        onUpdateRates={setRates}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      {/* 移动端与电脑端顶部状态栏 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
            FX
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              缅中做账与换汇系统
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              MMK & CNY BOOKKEEPING SYSTEM
            </p>
          </div>
        </div>

        {/* 顶部右侧快捷开关 */}
        <div className="flex items-center gap-2">
          {/* 屏幕视口切换 (手机模拟 / 响应式全屏) */}
          <button
            type="button"
            onClick={() => setForceMobileView(!forceMobileView)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="切换电脑宽屏与手机 App 视图模式"
          >
            {forceMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-600" />
                <span>切为电脑大屏</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>模拟手机 App</span>
              </>
            )}
          </button>

          <button
            id="header-quick-entry-btn"
            onClick={() => setActiveTab('entry')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>记一笔</span>
          </button>
        </div>
      </header>

      {/* 主体架构布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 电脑端大屏侧边栏 (当不是强制手机视图时显示) */}
        {!forceMobileView && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingCount}
          />
        )}

        {/* 主内容展示区 */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-10">
          {/* 1. 记账开单独立页面 (换汇/收入/支出/手工每日汇率计算) */}
          {activeTab === 'entry' && (
            <BookkeepingEntryPage
              rates={rates}
              accounts={accounts}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              onAddTransaction={handleAddTransaction}
              onOpenReceipt={setReceiptTx}
              onSaveDailyRate={handleSaveDailyRate}
              onNavigateToLedger={() => setActiveTab('ledger')}
            />
          )}

          {/* 2. 账本流水独立页面 (全量明细与筛选、核销、凭证) */}
          {activeTab === 'ledger' && (
            <LedgerPage
              transactions={transactions}
              onOpenReceipt={setReceiptTx}
              onUpdateStatus={handleUpdateTransactionStatus}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToEntry={() => setActiveTab('entry')}
            />
          )}

          {/* 3. 经营报表独立页面 (盈亏统计、资金周转、汇率走势曲线) */}
          {activeTab === 'report' && (
            <AnalyticsPage
              transactions={transactions}
              rates={rates}
            />
          )}

          {/* 4. 账户资金池独立页面 (KBZPay、WaveMoney、微信、支付宝等) */}
          {activeTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              rates={rates}
              onUpdateAccount={handleUpdateAccount}
              onAddAccount={handleAddAccount}
            />
          )}

          {/* 5. 汇率与系统设置独立页面 (每日手动汇率录入、数据备份恢复) */}
          {activeTab === 'settings' && (
            <RatesAndSettingsPage
              rates={rates}
              dailyRates={dailyRates}
              onUpdateRates={setRates}
              onSaveDailyRate={handleSaveDailyRate}
              onReloadAllData={handleReloadAllData}
            />
          )}
        </main>
      </div>

      {/* 手机端底部 App 导航栏 (在手机屏幕或强制手机视图下显示) */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* 单据凭证弹窗 (可打印、复制微信格式文本) */}
      <ReceiptModal
        transaction={receiptTx}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}

