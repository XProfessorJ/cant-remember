import Dexie, { Table } from 'dexie';
import { Card, ReviewSchedule, TagUsage } from '@/types';

// 数据库类
export class LearningDB extends Dexie {
  cards!: Table<Card, string>;
  reviewSchedules!: Table<ReviewSchedule, string>;
  tagUsages!: Table<TagUsage, string>;

  constructor() {
    super('LearningDB');
    
    this.version(1).stores({
      cards: 'id, question, createdAt, updatedAt, tags',
      reviewSchedules: 'cardId, dueDate, interval, repetitions, lastReviewed',
    });

    // 版本 2：添加标签使用情况表
    this.version(2).stores({
      cards: 'id, question, createdAt, updatedAt, tags',
      reviewSchedules: 'cardId, dueDate, interval, repetitions, lastReviewed',
      tagUsages: 'tag, count, lastUsed', // tag 是主键，count 和 lastUsed 是索引
    });
  }
}

// 创建数据库实例
export const db = new LearningDB();

// 数据库辅助函数
export const dbHelpers = {
  // 初始化卡片到复习计划
  async initReviewSchedule(cardId: string): Promise<ReviewSchedule> {
    const now = new Date();
    const schedule: ReviewSchedule = {
      cardId,
      dueDate: now, // 新卡片立即可以复习
      interval: 1, // 初始间隔1天
      repetitions: 0,
      easeFactor: 2.5, // 默认难度系数
      performanceHistory: [],
    };
    
    await db.reviewSchedules.add(schedule);
    return schedule;
  },

  // 获取到期的复习卡片
  async getDueCards(): Promise<Card[]> {
    const now = new Date();
    // 使用 dueDate 索引查询到期的复习计划（优化：使用索引而不是全表扫描）
    const dueSchedules = await db.reviewSchedules
      .where('dueDate')
      .belowOrEqual(now)
      .toArray();
    
    if (dueSchedules.length === 0) {
      return [];
    }
    
    const cardIds = dueSchedules.map(s => s.cardId);
    const cards = await db.cards.where('id').anyOf(cardIds).toArray();
    
    return cards;
  },

  // 获取所有卡片及其复习计划
  async getAllCardsWithSchedule(): Promise<Array<Card & { schedule?: ReviewSchedule }>> {
    const cards = await db.cards.toArray();
    const schedules = await db.reviewSchedules.toArray();
    const scheduleMap = new Map(schedules.map(s => [s.cardId, s]));
    
    return cards.map(card => ({
      ...card,
      schedule: scheduleMap.get(card.id),
    }));
  },

  // 获取今日完成的复习数量
  async getCompletedTodayCount(): Promise<number> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // 使用 lastReviewed 索引查询今天完成的复习（优化：使用索引范围查询）
    const completedToday = await db.reviewSchedules
      .where('lastReviewed')
      .between(todayStart, todayEnd, true, true) // true, true 表示包含边界
      .toArray();
    
    return completedToday.length;
  },

  // 计算记忆保留率
  // 记忆保留率 = (评分 >= 3 的次数 / 总复习次数) * 100
  // 评分 >= 3 表示掌握良好
  async getRetentionRate(): Promise<number> {
    // 获取所有复习计划
    const allSchedules = await db.reviewSchedules.toArray();
    
    // 统计所有评分
    let totalReviews = 0;
    let goodReviews = 0; // 评分 >= 3 的次数
    
    allSchedules.forEach(schedule => {
      const history = schedule.performanceHistory || [];
      totalReviews += history.length;
      
      // 统计掌握良好的次数（评分 >= 3）
      history.forEach(rating => {
        if (rating >= 3) {
          goodReviews++;
        }
      });
    });
    
    // 如果没有复习记录，返回 0
    if (totalReviews === 0) {
      return 0;
    }
    
    // 计算保留率（保留一位小数）
    const retentionRate = (goodReviews / totalReviews) * 100;
    return Math.round(retentionRate * 10) / 10;
  },

  // 获取最近N天的学习趋势数据
  async getDailyStats(days: number = 7): Promise<Array<{
    date: string;
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  }>> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 计算时间范围
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    // 一次性获取所有数据（优化性能）
    const [allCards, allSchedules] = await Promise.all([
      db.cards.toArray(),
      db.reviewSchedules.toArray(),
    ]);

    // 初始化过去N天的数据
    const stats: Array<{
      date: string;
      newCards: number;
      reviewsCompleted: number;
      averageRating: number;
      totalRating: number;
      ratingCount: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStat = {
        date: dateStr,
        newCards: 0,
        reviewsCompleted: 0,
        averageRating: 0,
        totalRating: 0,
        ratingCount: 0,
      };

      // 统计当天的新增卡片
      dayStat.newCards = allCards.filter(card => {
        const createdAt = new Date(card.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      // 统计当天的复习
      allSchedules.forEach(schedule => {
        if (!schedule.lastReviewed) {
          return;
        }
        
        const lastReviewed = new Date(schedule.lastReviewed);
        
        // 检查是否在当天范围内
        if (lastReviewed >= dayStart && lastReviewed <= dayEnd) {
          dayStat.reviewsCompleted++;
          
          // 获取最后一次评分
          const history = schedule.performanceHistory || [];
          if (history.length > 0) {
            const lastRating = history[history.length - 1];
            dayStat.totalRating += lastRating;
            dayStat.ratingCount++;
          }
        }
      });

      // 计算平均评分
      if (dayStat.ratingCount > 0) {
        dayStat.averageRating = dayStat.totalRating / dayStat.ratingCount;
      }

      stats.push(dayStat);
    }

    // 返回格式化的数据
    return stats.map(stat => ({
      date: stat.date,
      newCards: stat.newCards,
      reviewsCompleted: stat.reviewsCompleted,
      averageRating: Math.round(stat.averageRating * 10) / 10,
    }));
  },

  // 获取本周统计数据
  async getWeeklyStats(): Promise<{
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 计算本周的开始时间（周一 00:00:00）
    const dayOfWeek = today.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 如果是周日，向前推6天
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // 本周结束时间（周日 23:59:59）
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // 获取所有卡片
    const allCards = await db.cards.toArray();
    
    // 统计本周新增的卡片
    const newCards = allCards.filter(card => {
      const createdAt = new Date(card.createdAt);
      return createdAt >= weekStart && createdAt <= weekEnd;
    }).length;
    
    // 使用 lastReviewed 索引查询本周完成的复习（优化：使用索引范围查询）
    // 注意：lastReviewed 为 undefined 的记录不会被索引包含，这正是我们想要的
    const weekSchedules = await db.reviewSchedules
      .where('lastReviewed')
      .between(weekStart, weekEnd, true, true) // true, true 表示包含边界
      .toArray();
    
    // 统计本周完成的复习
    let reviewsCompleted = weekSchedules.length;
    let totalRating = 0;
    let ratingCount = 0;
    
    weekSchedules.forEach(schedule => {
      // 获取最后一次评分（即本次复习的评分）
      const history = schedule.performanceHistory || [];
      if (history.length > 0) {
        const lastRating = history[history.length - 1];
        totalRating += lastRating;
        ratingCount++;
      }
    });
    
    // 计算平均评分
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    
    return {
      newCards,
      reviewsCompleted,
      averageRating: Math.round(averageRating * 10) / 10, // 保留一位小数
    };
  },
};

