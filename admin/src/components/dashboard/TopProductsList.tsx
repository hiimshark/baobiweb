import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatNumber, formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export const TopProductsList: React.FC = () => {
  const { products } = useAppStore();
  const sorted = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const maxSales = Math.max(...sorted.map(p => p.salesCount), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Sản phẩm bán chạy nhất
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Xếp hạng theo sản lượng bán ra
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Quản lý</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {sorted.map((prod, idx) => {
            const percent = Math.round((prod.salesCount / maxSales) * 100);
            return (
              <div key={prod.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                      {prod.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(prod.salesCount)} {prod.unit}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({formatCurrency(prod.price)}/{prod.unit})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Tổng mặt hàng hoạt động:</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{products.length} sản phẩm</span>
      </div>
    </div>
  );
};
