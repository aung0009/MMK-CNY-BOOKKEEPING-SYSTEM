export type Currency = 'CNY' | 'MMK';

export type TransactionType = 'EXCHANGE' | 'INCOME' | 'EXPENSE';

export type ExchangeDirection = 'CNY_TO_MMK' | 'MMK_TO_CNY';

export type PaymentChannel =
  | 'KBZPay'
  | 'WaveMoney'
  | 'AYA_Bank'
  | 'CB_Bank'
  | 'MMK_Cash'
  | 'WeChat_Pay'
  | 'Alipay'
  | 'China_Bank'
  | 'CNY_Cash'
  | 'Other';

export type SettlementStatus = 'COMPLETED' | 'PENDING';

export interface Transaction {
  id: string;
  orderNo: string;
  type: TransactionType; // 'EXCHANGE' 换汇 | 'INCOME' 收入 | 'EXPENSE' 支出
  createdAt: string;     // ISO timestamp
  date: string;          // YYYY-MM-DD

  // 收入与支出专用字段 (INCOME / EXPENSE)
  amount?: number;
  currency?: Currency;
  category?: string;     // 分类名称，如 "房租物业", "员工薪资", "转账手续费", "换汇利润", "其他收入"
  accountId?: string;
  channel?: PaymentChannel;

  // 换汇专用字段 (EXCHANGE)
  direction?: ExchangeDirection; // 'CNY_TO_MMK' (收人民币出缅币) | 'MMK_TO_CNY' (收缅币出人民币)
  fromAmount?: number;
  fromCurrency?: Currency;
  toAmount?: number;
  toCurrency?: Currency;
  rate?: number;                 // 手动录入的汇率 (例如 1 CNY = 612.5 MMK)
  costRate?: number;             // 底价成本汇率
  profitEstimated?: number;      // 预估利差毛利 (CNY计)
  inChannel?: PaymentChannel;
  inAccountId?: string;
  inAccountInfo?: string;
  outChannel?: PaymentChannel;
  outAccountId?: string;
  outAccountInfo?: string;

  // 公共字段
  counterparty?: string;         // 交易对方/往来名称/经手人 (非强制客户，纯文字记录)
  fee?: number;                  // 附加手续费
  status: SettlementStatus;      // 结清或待处理
  note?: string;                 // 备注
  operator?: string;             // 经手出纳
}

export interface BankAccount {
  id: string;
  name: string;
  currency: Currency;
  channel: PaymentChannel;
  accountNumber: string;
  accountHolder: string;
  balance: number;
  isActive: boolean;
}

export interface DailyRateRecord {
  id: string;
  date: string;            // YYYY-MM-DD
  cnyToMmkSell: number;    // 今日出缅币汇率 (客户付CNY买MMK，例如 610)
  mmkToCnyBuy: number;     // 今日收缅币汇率 (客户付MMK买CNY，例如 620)
  marketBenchmark?: number;// 参考基准价
  note?: string;           // 当日汇率波动备注
  updatedAt: string;
}

export interface ExchangeRateConfig {
  cnyToMmkSell: number;    // 今日当前出缅币汇率 (例如 610.0)
  mmkToCnyBuy: number;     // 今日当前收缅币汇率 (例如 620.0)
  marketBenchmark: number; // 市场参考基准价 (例如 615.0)
  costCnyToMmk: number;    // 进价底价成本 (例如 614.5)
  costMmkToCny: number;    // 进价底价成本 (例如 613.5)
  updatedAt: string;
}

export interface AccountTransferRecord {
  id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  note: string;
}

export type ActiveTab = 
  | 'entry'      // 记账开单 (换汇 / 收入 / 支出)
  | 'ledger'     // 明细流水 (全部流水账本)
  | 'report'     // 汇总报表 (综合收支与利润财务报告)
  | 'accounts'   // 资金账户 (多币种资金池与划转)
  | 'settings';  // 汇率与设置 (每日手动汇率日志、收支分类与备份)

