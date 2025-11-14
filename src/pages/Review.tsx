import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCardStore } from '@/store/cardStore';
import { PerformanceRating } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardReview } from '@/components/CardReview';
import { ChevronRight } from 'lucide-react';

export function Review() {
  const navigate = useNavigate();
  const { dueCards, loading, fetchDueCards, reviewCard } = useCardStore();
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  // 使用 useRef 存储之前的索引，避免触发 useEffect 重新执行
  const previousCardIndexRef = useRef<number>(-1);
  // 记录初始卡片数量，用于计算进度
  const initialCardCountRef = useRef<number>(0);

  // 初始化：当 dueCards 加载后，设置第一个卡片
  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

  // 记录初始卡片数量（只在第一次加载时记录）
  useEffect(() => {
    // 只在初始数量为 0 且 dueCards 有数据时记录
    // 这样可以确保记录的是初始加载时的卡片数量
    if (initialCardCountRef.current === 0 && dueCards.length > 0) {
      initialCardCountRef.current = dueCards.length;
    }
  }, [dueCards.length]);

  // 当 dueCards 更新后，更新当前卡片
  useEffect(() => {
    if (dueCards.length === 0) {
      setCurrentCardId(null);
      previousCardIndexRef.current = -1;
      return;
    }

    // 如果当前卡片 ID 为空，设置为第一个卡片
    if (!currentCardId) {
      setCurrentCardId(dueCards[0]?.id || null);
      previousCardIndexRef.current = 0;
      return;
    }

    // 查找当前卡片是否还在 dueCards 中
    const currentIndex = dueCards.findIndex(card => card.id === currentCardId);
    
    if (currentIndex === -1) {
      // 当前卡片已不在到期列表中（可能已经复习完成）
      // 尝试保持之前的位置索引，如果该位置有卡片则使用
      const prevIndex = previousCardIndexRef.current;
      if (prevIndex >= 0 && prevIndex < dueCards.length) {
        // 如果之前的索引位置还有卡片，使用该位置的卡片（这相当于移动到下一个卡片）
        setCurrentCardId(dueCards[prevIndex].id);
        // previousCardIndexRef.current 保持不变
      } else if (dueCards.length > 0) {
        // 如果之前的索引位置没有卡片，使用第一个卡片
        setCurrentCardId(dueCards[0].id);
        previousCardIndexRef.current = 0;
      } else {
        setCurrentCardId(null);
        previousCardIndexRef.current = -1;
      }
      setShowAnswer(false); // 重置答案显示状态
    } else {
      // 如果当前卡片还在列表中，更新 previousCardIndexRef
      previousCardIndexRef.current = currentIndex;
    }
  }, [dueCards, currentCardId]);

  // 获取当前卡片
  const currentCard = currentCardId ? dueCards.find(card => card.id === currentCardId) : null;
  const currentIndex = currentCard ? dueCards.findIndex(card => card.id === currentCardId) : -1;

  const handleRating = async (rating: PerformanceRating) => {
    if (!currentCard) return;

    setIsReviewing(true);
    try {
      await reviewCard(currentCard.id, rating);
      setShowAnswer(false);
      
      // 复习完成后，dueCards 会更新，useEffect 会自动处理当前卡片的切换
      // 如果当前卡片已不在列表中，会自动移动到下一个卡片
      // 这里我们需要等待 dueCards 更新后再检查
      // 但由于 reviewCard 会触发 fetchDueCards，我们可以在下一次渲染时处理
    } catch (error) {
      console.error('记录复习失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleNext = () => {
    if (currentIndex === -1) {
      // 当前卡片不在列表中
      if (dueCards.length === 0) {
        navigate('/dashboard');
      } else {
        // 移动到第一个卡片
        setCurrentCardId(dueCards[0].id);
        previousCardIndexRef.current = 0;
        setShowAnswer(false);
      }
    } else if (currentIndex >= dueCards.length - 1) {
      // 已经是最后一个
      if (dueCards.length === 0) {
        navigate('/dashboard');
      } else {
        // 移动到第一个卡片（循环）
        setCurrentCardId(dueCards[0].id);
        previousCardIndexRef.current = 0;
        setShowAnswer(false);
      }
    } else {
      // 移动到下一个卡片
      const nextIndex = currentIndex + 1;
      setCurrentCardId(dueCards[nextIndex].id);
      previousCardIndexRef.current = nextIndex;
      setShowAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (dueCards.length === 0 || !currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">太棒了！</h2>
          <p className="text-gray-600 mb-6">今天没有需要复习的卡片</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            返回仪表盘
          </Button>
        </Card>
      </div>
    );
  }

  // 计算进度：已完成的卡片数 / 初始卡片数
  // 已完成的卡片数 = 初始卡片数 - 当前剩余卡片数
  // 如果还没有记录初始数量，使用当前数量（这意味着还没有开始复习）
  const totalCards = initialCardCountRef.current > 0 ? initialCardCountRef.current : dueCards.length;
  const completedCards = Math.max(0, totalCards - dueCards.length);
  // 确保进度在 0-100 之间
  const progress = totalCards > 0 
    ? Math.min(100, Math.max(0, (completedCards / totalCards) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 进度条 */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-primary-600 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              剩余 {dueCards.length} 张卡片
              {initialCardCountRef.current > 0 && initialCardCountRef.current !== dueCards.length && (
                <span className="text-gray-500 ml-2">
                  （已完成 {completedCards} / {totalCards}）
                </span>
              )}
            </p>
          </div>

          <div className="mb-6">
            <CardReview
              card={currentCard}
              showAnswer={showAnswer}
              onShowAnswer={() => setShowAnswer(true)}
              onRating={handleRating}
              isReviewing={isReviewing}
              footer={
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleNext}
                  className="w-full"
                >
                  跳过
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

