import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCardStore } from '@/store/cardStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, BookOpen, Clock, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { dueCards, cards, completedToday, retentionRate, loading } = useCardStore();

  useEffect(() => {
    // 在 useEffect 内部直接从 store 获取方法
    // Zustand 的方法引用是稳定的，不会导致无限循环
    const store = useCardStore.getState();
    store.fetchCards();
    store.fetchDueCards();
    store.fetchCompletedToday();
    store.fetchRetentionRate();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  const stats = {
    totalCards: cards.length,
    dueCards: dueCards.length,
    completedToday: completedToday,
    retentionRate: retentionRate,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">仪表盘</h1>
          <p className="text-gray-600">欢迎回来！今天要复习 {dueCards.length} 张卡片</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总卡片数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">待复习</p>
                <p className="text-2xl font-bold text-primary-600">{stats.dueCards}</p>
              </div>
              <Clock className="w-8 h-8 text-primary-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">今日完成</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
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
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/cards')}
                className="flex-1"
              >
                <Plus className="w-5 h-5 mr-2" />
                创建新卡片
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/review')}
                className="flex-1"
                disabled={dueCards.length === 0}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                开始复习 ({dueCards.length})
              </Button>
            </div>
          </Card>
        </div>

        {/* 最近卡片 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近创建的卡片</h2>
          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : cards.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">还没有创建任何卡片</p>
              <Button variant="primary" onClick={() => navigate('/cards')}>
                <Plus className="w-5 h-5 mr-2" />
                创建第一张卡片
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {cards.slice(0, 5).map((card) => (
                <Card key={card.id} className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{card.question}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{card.answer.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

