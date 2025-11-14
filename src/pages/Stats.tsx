import { useEffect, useState } from 'react';
import { useCardStore } from '@/store/cardStore';
import { Card } from '@/components/ui/Card';
import { BarChart, TrendingUp, Calendar } from 'lucide-react';
import { MultiBarChart, SimpleLineChart } from '@/components/SimpleChart';

export function Stats() {
  const {
    cards,
    dueCards,
    completedToday,
    retentionRate,
    weeklyStats,
    dailyStats,
  } = useCardStore();

  const [chartDays, setChartDays] = useState(7);

  useEffect(() => {
    // 在 useEffect 内部直接从 store 获取方法
    // Zustand 的方法引用是稳定的，不会导致无限循环
    const store = useCardStore.getState();
    store.fetchCards();
    store.fetchDueCards();
    store.fetchCompletedToday();
    store.fetchRetentionRate();
    store.fetchWeeklyStats();
    store.fetchDailyStats(chartDays);
  }, [chartDays]); // 当 chartDays 改变时重新获取数据

  const stats = {
    totalCards: cards.length,
    dueCards: dueCards.length,
    completedToday: completedToday,
    retentionRate: retentionRate,
    weeklyProgress: weeklyStats,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学习统计</h1>
          <p className="text-gray-600">查看您的学习进度和效果</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总卡片数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              </div>
              <BarChart className="w-8 h-8 text-primary-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">记忆保留率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.retentionRate > 0 ? `${stats.retentionRate}%` : '-'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">本周完成</p>
                <p className="text-2xl font-bold text-gray-900">{stats.weeklyProgress.reviewsCompleted}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* 图表区域 */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">学习趋势</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartDays(7)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartDays === 7
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7天
              </button>
              <button
                onClick={() => setChartDays(30)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartDays === 30
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30天
              </button>
            </div>
          </div>
          
          {dailyStats.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>暂无数据</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 复习完成数和新增卡片数 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">每日活动</h3>
                <MultiBarChart data={dailyStats} height={250} />
              </div>

              {/* 平均评分趋势 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">平均评分趋势</h3>
                <SimpleLineChart data={dailyStats} height={250} />
              </div>
            </div>
          )}
        </Card>

        {/* 周报 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">本周报告</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">新增卡片</span>
              <span className="font-semibold">{stats.weeklyProgress.newCards}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">完成复习</span>
              <span className="font-semibold">{stats.weeklyProgress.reviewsCompleted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均评分</span>
              <span className="font-semibold">
                {stats.weeklyProgress.averageRating > 0
                  ? stats.weeklyProgress.averageRating.toFixed(1)
                  : '-'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

