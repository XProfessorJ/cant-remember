import { create } from 'zustand';
import { Card, PerformanceRating } from '@/types';
import { CardService } from '@/services/cardService';
import { SM2Algorithm } from '@/lib/sm2-algorithm';

interface CardStore {
  cards: Card[];
  dueCards: Card[];
  completedToday: number;
  retentionRate: number;
  weeklyStats: {
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  };
  dailyStats: Array<{
    date: string;
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  }>;
  loading: boolean;
  error: string | null;
  
  // 操作
  fetchCards: () => Promise<void>;
  fetchDueCards: () => Promise<void>;
  fetchCompletedToday: () => Promise<void>;
  fetchRetentionRate: () => Promise<void>;
  fetchWeeklyStats: () => Promise<void>;
  fetchDailyStats: (days?: number) => Promise<void>;
  createCard: (input: Parameters<typeof CardService.createCard>[0]) => Promise<void>;
  updateCard: (id: string, input: Parameters<typeof CardService.updateCard>[1]) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reviewCard: (cardId: string, rating: PerformanceRating) => Promise<void>;
  searchCards: (query: string) => Promise<Card[]>;
  
  // 重置状态
  reset: () => void;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  dueCards: [],
  completedToday: 0,
  retentionRate: 0,
  weeklyStats: {
    newCards: 0,
    reviewsCompleted: 0,
    averageRating: 0,
  },
  dailyStats: [],
  loading: false,
  error: null,

  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const cards = await CardService.getAllCards();
      set({ cards, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取卡片失败',
        loading: false 
      });
    }
  },

  fetchDueCards: async () => {
    set({ loading: true, error: null });
    try {
      const dueCards = await CardService.getDueCards();
      set({ dueCards, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取到期卡片失败',
        loading: false 
      });
    }
  },

  fetchCompletedToday: async () => {
    try {
      const count = await CardService.getCompletedTodayCount();
      set({ completedToday: count });
    } catch (error) {
      console.error('获取今日完成数量失败:', error);
      // 不设置错误状态，因为这个不是关键功能
    }
  },

  fetchRetentionRate: async () => {
    try {
      const rate = await CardService.getRetentionRate();
      set({ retentionRate: rate });
    } catch (error) {
      console.error('获取记忆保留率失败:', error);
      // 不设置错误状态，因为这个不是关键功能
      set({ retentionRate: 0 });
    }
  },

  fetchWeeklyStats: async () => {
    try {
      const stats = await CardService.getWeeklyStats();
      set({ weeklyStats: stats });
    } catch (error) {
      console.error('获取本周统计数据失败:', error);
      // 不设置错误状态，因为这个不是关键功能
      set({
        weeklyStats: {
          newCards: 0,
          reviewsCompleted: 0,
          averageRating: 0,
        },
      });
    }
  },

  fetchDailyStats: async (days: number = 7) => {
    try {
      const stats = await CardService.getDailyStats(days);
      set({ dailyStats: stats });
    } catch (error) {
      console.error('获取每日统计数据失败:', error);
      // 不设置错误状态，因为这个不是关键功能
      set({ dailyStats: [] });
    }
  },

  createCard: async (input) => {
    set({ loading: true, error: null });
    try {
      await CardService.createCard(input);
      await get().fetchCards();
      await get().fetchDueCards();
      await get().fetchWeeklyStats(); // 更新本周统计数据
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '创建卡片失败',
        loading: false 
      });
    }
  },

  updateCard: async (id, input) => {
    set({ loading: true, error: null });
    try {
      await CardService.updateCard(id, input);
      await get().fetchCards();
      await get().fetchDueCards();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '更新卡片失败',
        loading: false 
      });
    }
  },

  deleteCard: async (id) => {
    set({ loading: true, error: null });
    try {
      await CardService.deleteCard(id);
      await get().fetchCards();
      await get().fetchDueCards();
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '删除卡片失败',
        loading: false 
      });
    }
  },

  reviewCard: async (cardId, rating) => {
    set({ loading: true, error: null });
    try {
      await SM2Algorithm.recordReview(cardId, rating);
      await get().fetchCards();
      await get().fetchDueCards();
      await get().fetchCompletedToday(); // 更新今日完成数量
      await get().fetchRetentionRate(); // 更新记忆保留率
      await get().fetchWeeklyStats(); // 更新本周统计数据
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '记录复习失败',
        loading: false 
      });
    }
  },

  searchCards: async (query) => {
    if (!query.trim()) {
      return get().cards;
    }
    try {
      return await CardService.searchCards(query);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '搜索卡片失败',
      });
      return [];
    }
  },

  reset: () => {
    set({
      cards: [],
      dueCards: [],
      completedToday: 0,
      retentionRate: 0,
      weeklyStats: {
        newCards: 0,
        reviewsCompleted: 0,
        averageRating: 0,
      },
      dailyStats: [],
      loading: false,
      error: null,
    });
  },
}));

