import React from 'react';
import { 
  Calculator, 
  ReceiptText, 
  Wallet, 
  BarChart3, 
  Settings, 
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<NavProps> = ({ activeTab, onTabChange, pendingCount = 0 }) => {
  const navItems = [
    { id: 'entry' as ActiveTab, label: '记账开单', icon: Calculator, desc: '换汇与日常收支录入' },
    { id: 'ledger' as ActiveTab, label: '流水明细', icon: ReceiptText, desc: '双币全量明细账本', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'report' as ActiveTab, label: '汇总报表', icon: BarChart3, desc: '综合收支与财务利润' },
    { id: 'settings' as ActiveTab, label: '每日汇率', icon: Settings, desc: '每日手动汇率与分类' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* 品牌标识 */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 text-lg">
            MMK
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              缅中做账系统
            </h1>
            <span className="text-[11px] text-amber-400/90 font-medium">MMK & CNY BOOKKEEPING</span>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">
          财务核心模块
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* 底部快捷状态 */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            本地做账已同步
          </span>
          <span className="text-slate-500">双币做账版</span>
        </div>
        <button
          onClick={() => onTabChange('entry')}
          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>快速记账录入</span>
        </button>
      </div>
    </aside>
  );
};

export const MobileTabBar: React.FC<NavProps> = ({ activeTab, onTabChange, pendingCount = 0 }) => {
  const tabs = [
    { id: 'entry' as ActiveTab, label: '记账', icon: Calculator },
    { id: 'ledger' as ActiveTab, label: '明细', icon: ReceiptText, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'report' as ActiveTab, label: '报表', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: '汇率设置', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {tab.badge ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-amber-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
