import { PerformanceRating, ReviewSchedule } from '@/types';
import { db } from './db';

/**
 * SM-2 间隔重复算法
 * 基于 SuperMemo 2 算法实现
 */
export class SM2Algorithm {
  // 默认初始间隔（天）
  private static readonly INITIAL_INTERVAL = 1;
  // 默认难度系数
  private static readonly DEFAULT_EASE_FACTOR = 2.5;
  // 最小难度系数
  private static readonly MIN_EASE_FACTOR = 1.3;

  /**
   * 计算下次复习间隔
   * @param schedule 当前复习计划
   * @param rating 本次自评分数
   * @returns 更新后的复习计划
   */
  static calculateNextReview(
    schedule: ReviewSchedule,
    rating: PerformanceRating
  ): ReviewSchedule {
    const now = new Date();
    let { interval, repetitions, easeFactor } = schedule;

    // 根据评分调整难度系数和间隔
    if (rating >= 3) {
      // 3分及以上：掌握良好
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      // 轻微提升难度系数,调低复习频率
      easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    } else if (rating === 2) {
      // 2分：一般掌握
      if (repetitions > 0) {
        interval = Math.max(1, Math.round(interval * 0.8));
      } else {
        interval = 1;
      }
      repetitions += 1;
      // 轻微降低难度系数,调高复习频率
      easeFactor = Math.max(this.MIN_EASE_FACTOR, easeFactor - 0.15);
    } else {
      // 0-1分：掌握差，重置
      interval = this.INITIAL_INTERVAL;
      repetitions = 0;
      easeFactor = Math.max(this.MIN_EASE_FACTOR, easeFactor - 0.2);
    }

    // 确保难度系数在合理范围内
    easeFactor = Math.max(this.MIN_EASE_FACTOR, easeFactor);

    // 计算下次复习时间
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + interval);

    // 更新历史记录
    const performanceHistory = [...schedule.performanceHistory, rating];

    return {
      ...schedule,
      interval,
      repetitions,
      easeFactor: Math.round(easeFactor * 100) / 100, // 保留两位小数
      dueDate,
      lastReviewed: now,
      performanceHistory,
    };
  }

  /**
   * 记录复习结果并更新计划
   */
  static async recordReview(
    cardId: string,
    rating: PerformanceRating
  ): Promise<ReviewSchedule> {
    // 获取当前复习计划
    let schedule = await db.reviewSchedules.get(cardId);
    
    if (!schedule) {
      // 如果没有复习计划，创建新的
      schedule = {
        cardId,
        dueDate: new Date(),
        interval: this.INITIAL_INTERVAL,
        repetitions: 0,
        easeFactor: this.DEFAULT_EASE_FACTOR,
        performanceHistory: [],
      };
    }

    // 计算新的复习计划
    const updatedSchedule = this.calculateNextReview(schedule, rating);

    // 保存到数据库
    await db.reviewSchedules.put(updatedSchedule);

    return updatedSchedule;
  }

  /**
   * 获取复习优先级（到期时间越近优先级越高）
   */
  static getReviewPriority(schedule: ReviewSchedule): number {
    const now = new Date();
    const daysUntilDue = Math.ceil(
      (schedule.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // 已到期的卡片优先级最高
    if (daysUntilDue <= 0) {
      return 1000 + Math.abs(daysUntilDue);
    }
    
    // 未到期的卡片，间隔越短优先级越高
    return 100 - daysUntilDue;
  }
}

