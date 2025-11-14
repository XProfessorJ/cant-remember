import { useEffect, useState } from 'react';
import { useCardStore } from '@/store/cardStore';
import { CardForm } from '@/components/CardForm';
import { CardItem } from '@/components/CardItem';
import { Button } from '@/components/ui/Button';
import { CardReview } from '@/components/CardReview';
import { Card as CardType, CreateCardInput, UpdateCardInput, PerformanceRating } from '@/types';
import { Plus, Search, ArrowLeft, Edit, Trash2 } from 'lucide-react';

export function Cards() {
  const { cards, loading, createCard, updateCard, deleteCard, reviewCard } = useCardStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  useEffect(() => {
    // 在 useEffect 内部直接从 store 获取方法
    const store = useCardStore.getState();
    store.fetchCards();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        // 从 store 获取 searchCards 方法
        const store = useCardStore.getState();
        const results = await store.searchCards(searchQuery);
        setFilteredCards(results);
      } else {
        setFilteredCards(cards);
      }
    };
    performSearch();
  }, [searchQuery, cards]); // searchQuery 和 cards 是真正的依赖

  const handleCreateCard = async (input: CreateCardInput | UpdateCardInput) => {
    if (editingCard) {
      await updateCard(editingCard.id, input as UpdateCardInput);
    } else {
      await createCard(input as CreateCardInput);
    }
    setIsFormOpen(false);
    setEditingCard(undefined);
  };

  // 当卡片列表更新时，如果正在查看某个卡片，更新选中的卡片
  useEffect(() => {
    if (selectedCard && cards.length > 0) {
      const updatedCard = cards.find(c => c.id === selectedCard.id);
      if (updatedCard) {
        setSelectedCard(updatedCard);
      }
    }
  }, [cards, selectedCard?.id]);

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setIsFormOpen(true);
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCard(undefined);
  };

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setShowAnswer(false);
  };

  const handleBackToList = () => {
    setSelectedCard(null);
    setShowAnswer(false);
  };

  const handleRating = async (rating: PerformanceRating) => {
    if (!selectedCard) return;

    setIsReviewing(true);
    setRatingSuccess(false);
    try {
      // 记录复习（会自动更新统计数据）
      await reviewCard(selectedCard.id, rating);
      setRatingSuccess(true);
      // 2秒后隐藏成功提示
      setTimeout(() => {
        setRatingSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('记录复习失败:', error);
      alert('记录复习失败，请重试');
    } finally {
      setIsReviewing(false);
    }
  };

  // 如果选中了卡片，显示详情视图
  if (selectedCard) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮和操作按钮 */}
          <div className="mb-6 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCard(selectedCard);
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('确定要删除这张卡片吗？')) {
                    handleDeleteCard(selectedCard.id);
                    handleBackToList();
                  }
                }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
            </div>
          </div>

          {/* 卡片详情 */}
          <CardReview
            card={selectedCard}
            showAnswer={showAnswer}
            onShowAnswer={() => setShowAnswer(true)}
            onRating={handleRating}
            isReviewing={isReviewing}
            ratingSuccess={ratingSuccess}
            showSuccessMessage={true}
            actions={
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleBackToList}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回列表
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowAnswer(false)}
                  className="flex-1"
                >
                  隐藏答案
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">卡片库</h1>
            <p className="text-gray-600">管理您的所有知识卡片</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setEditingCard(undefined);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            创建卡片
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索卡片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* 卡片列表 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {searchQuery ? '没有找到匹配的卡片' : '还没有创建任何卡片'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                创建第一张卡片
              </Button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              共 {filteredCards.length} 张卡片
            </p>
            <div className="space-y-4">
              {filteredCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* 卡片表单 */}
        <CardForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleCreateCard}
          card={editingCard}
        />
      </div>
    </div>
  );
}

