import { BankAccount, DailyRateRecord, ExchangeRateConfig, PaymentChannel, SettlementStatus, Transaction, TransactionType } from '../types';
import { initialAccounts, initialDailyRates, initialExpenseCategories, initialIncomeCategories, initialRates, initialTransactions } from '../data/mockData';

const STORAGE_KEYS = {
  RATES: 'mmk_cny_rates_v2',
  DAILY_RATES: 'mmk_cny_daily_rates_v2',
  ACCOUNTS: 'mmk_cny_accounts_v2',
  TRANSACTIONS: 'mmk_cny_transactions_v2',
  INCOME_CATS: 'mmk_cny_income_cats_v2',
  EXPENSE_CATS: 'mmk_cny_expense_cats_v2',
};

// 汇率配置 (今日当前值)
export const getStoredRates = (): ExchangeRateConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RATES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse rates from storage', e);
  }
  return initialRates;
};

export const saveStoredRates = (rates: ExchangeRateConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
  } catch (e) {
    console.error('Failed to save rates to storage', e);
  }
};

// 每日手动录入的汇率历史记录
export const getStoredDailyRates = (): DailyRateRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_RATES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse daily rates from storage', e);
  }
  return initialDailyRates;
};

export const saveStoredDailyRates = (rates: DailyRateRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_RATES, JSON.stringify(rates));
  } catch (e) {
    console.error('Failed to save daily rates to storage', e);
  }
};

// 资金账户
export const getStoredAccounts = (): BankAccount[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse accounts from storage', e);
  }
  return initialAccounts;
};

export const saveStoredAccounts = (accounts: BankAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to storage', e);
  }
};

// 流水交易记录
export const getStoredTransactions = (): Transaction[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse transactions from storage', e);
  }
  return initialTransactions;
};

export const saveStoredTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to storage', e);
  }
};

// 收入与支出分类列表
export const getStoredIncomeCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOME_CATS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse income categories', e);
  }
  return initialIncomeCategories;
};

export const saveStoredIncomeCategories = (cats: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.INCOME_CATS, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save income categories', e);
  }
};

export const getStoredExpenseCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse expense categories', e);
  }
  return initialExpenseCategories;
};

export const saveStoredExpenseCategories = (cats: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATS, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save expense categories', e);
  }
};

// 重置为初始演示数据
export const resetToDemoData = () => {
  localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(initialRates));
  localStorage.setItem(STORAGE_KEYS.DAILY_RATES, JSON.stringify(initialDailyRates));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initialAccounts));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  localStorage.setItem(STORAGE_KEYS.INCOME_CATS, JSON.stringify(initialIncomeCategories));
  localStorage.setItem(STORAGE_KEYS.EXPENSE_CATS, JSON.stringify(initialExpenseCategories));
};

// 导出所有数据为 JSON
export const exportAllDataJSON = (): string => {
  const data = {
    version: '2.0',
    exportTime: new Date().toISOString(),
    rates: getStoredRates(),
    dailyRates: getStoredDailyRates(),
    accounts: getStoredAccounts(),
    transactions: getStoredTransactions(),
    incomeCategories: getStoredIncomeCategories(),
    expenseCategories: getStoredExpenseCategories(),
  };
  return JSON.stringify(data, null, 2);
};

// 导入 JSON 数据
export const importAllDataJSON = (jsonStr: string): boolean => {
  try {
    const data = JSON.parse(jsonStr);
    if (data.rates && data.accounts && data.transactions) {
      saveStoredRates(data.rates);
      saveStoredAccounts(data.accounts);
      saveStoredTransactions(data.transactions);
      if (data.dailyRates) saveStoredDailyRates(data.dailyRates);
      if (data.incomeCategories) saveStoredIncomeCategories(data.incomeCategories);
      if (data.expenseCategories) saveStoredExpenseCategories(data.expenseCategories);
      return true;
    }
  } catch (err) {
    console.error('Failed to import JSON', err);
  }
  return false;
};

// 格式化工具
export const formatMMK = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount || 0));
};

export const formatCNY = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatCurrency = (amount: number, currency: 'CNY' | 'MMK'): string => {
  if (currency === 'MMK') {
    return `${formatMMK(amount)} MMK`;
  }
  return `¥${formatCNY(amount)}`;
};

export const channelLabels: Record<PaymentChannel, { label: string; flag: string; badgeClass: string }> = {
  KBZPay: { label: 'KBZPay (KPay)', flag: '🇲🇲', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  WaveMoney: { label: 'WaveMoney', flag: '🇲🇲', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  AYA_Bank: { label: 'AYA Bank', flag: '🇲🇲', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  CB_Bank: { label: 'CB Bank', flag: '🇲🇲', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MMK_Cash: { label: '缅币现钞 (Cash)', flag: '💵', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  
  WeChat_Pay: { label: '微信支付', flag: '🇨🇳', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  Alipay: { label: '支付宝', flag: '🇨🇳', badgeClass: 'bg-sky-50 text-sky-800 border-sky-300' },
  China_Bank: { label: '国内银行卡', flag: '🇨🇳', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  CNY_Cash: { label: '人民币现钞', flag: '💴', badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  Other: { label: '其他渠道', flag: '🌐', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const statusLabels: Record<SettlementStatus, { text: string; bg: string; textCol: string; border: string }> = {
  COMPLETED: { text: '已记账结清', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
  PENDING: { text: '待核销/在途', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
};

export const typeLabels: Record<TransactionType, { text: string; bg: string; textCol: string; border: string; icon: string }> = {
  EXCHANGE: { text: '换汇业务', bg: 'bg-blue-50', textCol: 'text-blue-700', border: 'border-blue-200', icon: '🔄' },
  INCOME: { text: '日常收入', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' },
  EXPENSE: { text: '日常支出', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200', icon: '🔴' },
};

