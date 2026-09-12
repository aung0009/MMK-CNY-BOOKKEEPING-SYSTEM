import { BankAccount, DailyRateRecord, ExchangeRateConfig, Transaction } from '../types';

export const initialRates: ExchangeRateConfig = {
  cnyToMmkSell: 610.0, // 今日出缅币汇率 (客户付CNY换MMK): 1 CNY = 610 MMK
  mmkToCnyBuy: 620.0,  // 今日收缅币汇率 (客户付MMK换CNY): 620 MMK = 1 CNY
  marketBenchmark: 615.0, // 市场参考基准公价
  costCnyToMmk: 614.5, // 我方进价底价成本: 614.5, 卖610, 利差 4.5 MMK/CNY
  costMmkToCny: 613.5, // 我方收MMK底价成本: 613.5, 出620
  updatedAt: new Date().toISOString(),
};

// 用户每日手动录入的历史汇率记录表
export const initialDailyRates: DailyRateRecord[] = [
  {
    id: 'rate_20260912',
    date: '2026-09-12',
    cnyToMmkSell: 610.0,
    mmkToCnyBuy: 620.0,
    marketBenchmark: 615.0,
    note: '今日大盘早盘走高，边贸口岸资金需求大',
    updatedAt: '2026-09-12 08:30:00',
  },
  {
    id: 'rate_20260911',
    date: '2026-09-11',
    cnyToMmkSell: 608.0,
    mmkToCnyBuy: 618.0,
    marketBenchmark: 613.0,
    note: '瓦城玉石公盘开盘，缅币稍有走强',
    updatedAt: '2026-09-11 09:00:00',
  },
  {
    id: 'rate_20260910',
    date: '2026-09-10',
    cnyToMmkSell: 607.0,
    mmkToCnyBuy: 617.0,
    marketBenchmark: 612.0,
    note: '平稳波动',
    updatedAt: '2026-09-10 08:45:00',
  },
  {
    id: 'rate_20260909',
    date: '2026-09-09',
    cnyToMmkSell: 605.0,
    mmkToCnyBuy: 615.0,
    marketBenchmark: 610.0,
    note: '周初常规汇价',
    updatedAt: '2026-09-09 08:30:00',
  },
  {
    id: 'rate_20260908',
    date: '2026-09-08',
    cnyToMmkSell: 602.0,
    mmkToCnyBuy: 612.0,
    marketBenchmark: 607.0,
    note: '市场基准回落',
    updatedAt: '2026-09-08 09:10:00',
  },
];

export const initialIncomeCategories = [
  '换汇利润',
  '手续费收入',
  '佣金与中介分成',
  '资金利息收益',
  '边贸货款结算',
  '其他营业收入',
];

export const initialExpenseCategories = [
  '房租与物业费',
  '员工薪资与提成',
  '通道转账手续费',
  '通信与网络水电',
  '交通差旅与运费',
  '餐饮招待费',
  '汇兑折损与补亏',
  '日常杂费与办公耗材',
  '其他支出',
];

export const initialAccounts: BankAccount[] = [
  // 缅币账户 (MMK)
  {
    id: 'acc_mmk_kpay',
    name: 'KBZPay 商务主户',
    currency: 'MMK',
    channel: 'KBZPay',
    accountNumber: '09-778899221',
    accountHolder: 'Daw Nilar Win',
    balance: 52000000, // 5200万 MMK
    isActive: true,
  },
  {
    id: 'acc_mmk_wave',
    name: 'WaveMoney 柜台商户',
    currency: 'MMK',
    channel: 'WaveMoney',
    accountNumber: '09-965412338',
    accountHolder: 'U Kyaw Myint',
    balance: 26800000, // 2680万 MMK
    isActive: true,
  },
  {
    id: 'acc_mmk_aya',
    name: 'AYA Bank 仰光公户',
    currency: 'MMK',
    channel: 'AYA_Bank',
    accountNumber: '200-3884-9102',
    accountHolder: 'Golden Shwe Trading Co.',
    balance: 145000000, // 1.45亿 MMK
    isActive: true,
  },
  {
    id: 'acc_mmk_cb',
    name: 'CB Bank 瓦城分行',
    currency: 'MMK',
    channel: 'CB_Bank',
    accountNumber: '0019-2847-2911',
    accountHolder: 'Ko Aung Htet',
    balance: 48000000,
    isActive: true,
  },
  {
    id: 'acc_mmk_cash',
    name: '木姐营业部缅币现金池',
    currency: 'MMK',
    channel: 'MMK_Cash',
    accountNumber: 'CASH-MMK-01',
    accountHolder: '现钞库管',
    balance: 35000000,
    isActive: true,
  },

  // 人民币账户 (CNY)
  {
    id: 'acc_cny_wx',
    name: '微信商户收付款01',
    currency: 'CNY',
    channel: 'WeChat_Pay',
    accountNumber: 'wxid_shwe8899',
    accountHolder: '张主管',
    balance: 96500.0,
    isActive: true,
  },
  {
    id: 'acc_cny_ali',
    name: '支付宝 对公结算卡',
    currency: 'CNY',
    channel: 'Alipay',
    accountNumber: 'finance@shwemyan.com',
    accountHolder: '边贸结算中心',
    balance: 154200.0,
    isActive: true,
  },
  {
    id: 'acc_cny_icbc',
    name: '中国工商银行 (瑞丽支行)',
    currency: 'CNY',
    channel: 'China_Bank',
    accountNumber: '6222 0834 0001 9284',
    accountHolder: '陈建国',
    balance: 380000.0,
    isActive: true,
  },
  {
    id: 'acc_cny_ccb',
    name: '中国建设银行 (昆明)',
    currency: 'CNY',
    channel: 'China_Bank',
    accountNumber: '6217 0072 0005 8192',
    accountHolder: '陈建国',
    balance: 215000.0,
    isActive: true,
  },
  {
    id: 'acc_cny_cash',
    name: '姐告前台现钞金库',
    currency: 'CNY',
    channel: 'CNY_Cash',
    accountNumber: 'CASH-CNY-01',
    accountHolder: '前台柜长',
    balance: 42000.0,
    isActive: true,
  },
];

export const initialTransactions: Transaction[] = [
  // 1. 换汇交易
  {
    id: 'tx_1001',
    orderNo: 'FX20260912-001',
    type: 'EXCHANGE',
    createdAt: '2026-09-12 11:20:15',
    date: '2026-09-12',
    counterparty: '瓦城翡翠贸易',
    direction: 'CNY_TO_MMK',
    fromAmount: 50000,
    fromCurrency: 'CNY',
    toAmount: 30500000,
    toCurrency: 'MMK',
    rate: 610.0, // 当日手动输入汇率
    costRate: 614.5,
    fee: 0,
    profitEstimated: 366.1,
    inChannel: 'WeChat_Pay',
    inAccountId: 'acc_cny_wx',
    outChannel: 'KBZPay',
    outAccountId: 'acc_mmk_kpay',
    status: 'COMPLETED',
    note: '翡翠玉石采购出款，全额结清',
    operator: '张主管',
  },
  // 2. 收入记账
  {
    id: 'tx_1002',
    orderNo: 'INC20260912-001',
    type: 'INCOME',
    createdAt: '2026-09-12 10:45:00',
    date: '2026-09-12',
    amount: 1500.0,
    currency: 'CNY',
    category: '手续费收入',
    accountId: 'acc_cny_wx',
    channel: 'WeChat_Pay',
    counterparty: '木姐通达物流',
    status: 'COMPLETED',
    note: '代办跨境大额加急清算手续费',
    operator: '李出纳',
  },
  // 3. 支出记账 (MMK)
  {
    id: 'tx_1003',
    orderNo: 'EXP20260912-001',
    type: 'EXPENSE',
    createdAt: '2026-09-12 09:30:00',
    date: '2026-09-12',
    amount: 1800000, // 180万 MMK
    currency: 'MMK',
    category: '房租与物业费',
    accountId: 'acc_mmk_kpay',
    channel: 'KBZPay',
    counterparty: '仰光写字楼房东',
    status: 'COMPLETED',
    note: '9月份仰光营业点月租金',
    operator: '张主管',
  },
  // 4. 换汇交易 (收MMK出CNY)
  {
    id: 'tx_1004',
    orderNo: 'FX20260912-002',
    type: 'EXCHANGE',
    createdAt: '2026-09-12 09:15:30',
    date: '2026-09-12',
    counterparty: '木姐通达物流',
    direction: 'MMK_TO_CNY',
    fromAmount: 62000000, // 62,000,000 MMK
    fromCurrency: 'MMK',
    toAmount: 100000,     // 100,000 CNY
    toCurrency: 'CNY',
    rate: 620.0,          // 当日手动输入汇率
    costRate: 613.5,
    fee: 100,
    profitEstimated: 1148.0,
    inChannel: 'AYA_Bank',
    inAccountId: 'acc_mmk_aya',
    outChannel: 'China_Bank',
    outAccountId: 'acc_cny_icbc',
    status: 'COMPLETED',
    note: '冷链货款回国内',
    operator: '李出纳',
  },
  // 5. 支出记账 (CNY)
  {
    id: 'tx_1005',
    orderNo: 'EXP20260911-001',
    type: 'EXPENSE',
    createdAt: '2026-09-11 17:00:00',
    date: '2026-09-11',
    amount: 320.0,
    currency: 'CNY',
    category: '通道转账手续费',
    accountId: 'acc_cny_icbc',
    channel: 'China_Bank',
    counterparty: '中国工商银行',
    status: 'COMPLETED',
    note: '网银跨行批量代发提现手续费',
    operator: '李出纳',
  },
  // 6. 收入记账 (MMK)
  {
    id: 'tx_1006',
    orderNo: 'INC20260911-002',
    type: 'INCOME',
    createdAt: '2026-09-11 15:20:00',
    date: '2026-09-11',
    amount: 500000, // 50万 MMK
    currency: 'MMK',
    category: '佣金与中介分成',
    accountId: 'acc_mmk_wave',
    channel: 'WaveMoney',
    counterparty: '瓦城合作钱庄',
    status: 'COMPLETED',
    note: '大宗现金提款转介返佣',
    operator: '张主管',
  },
  // 7. 换汇交易 (前一天，不同汇率 608)
  {
    id: 'tx_1007',
    orderNo: 'FX20260911-003',
    type: 'EXCHANGE',
    createdAt: '2026-09-11 14:10:00',
    date: '2026-09-11',
    counterparty: '中缅代购小林',
    direction: 'CNY_TO_MMK',
    fromAmount: 20000,
    fromCurrency: 'CNY',
    toAmount: 12160000,
    toCurrency: 'MMK',
    rate: 608.0, // 9月11日手动设定的汇率
    costRate: 613.0,
    fee: 0,
    profitEstimated: 163.1,
    inChannel: 'Alipay',
    inAccountId: 'acc_cny_ali',
    outChannel: 'WaveMoney',
    outAccountId: 'acc_mmk_wave',
    status: 'COMPLETED',
    note: '日化货款代付',
    operator: '张主管',
  },
  // 8. 支出记账 (员工工资)
  {
    id: 'tx_1008',
    orderNo: 'EXP20260910-001',
    type: 'EXPENSE',
    createdAt: '2026-09-10 18:00:00',
    date: '2026-09-10',
    amount: 6000.0,
    currency: 'CNY',
    category: '员工薪资与提成',
    accountId: 'acc_cny_ali',
    channel: 'Alipay',
    counterparty: '前台兼出纳小陈',
    status: 'COMPLETED',
    note: '8月绩效薪水发放',
    operator: '陈建国',
  },
];

