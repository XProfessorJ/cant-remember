import { db } from '@/lib/db';
import { dbHelpers } from '@/lib/db';
import { Card, CreateCardInput, UpdateCardInput } from '@/types';

// 生成唯一ID
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 卡片管理服务
 */
export class CardService {
  /**
   * 创建新卡片
   */
  static async createCard(input: CreateCardInput): Promise<Card> {
    const now = new Date();
    const card: Card = {
      id: generateId(),
      question: input.question,
      answer: input.answer,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    // 保存卡片
    await db.cards.add(card);

    // 初始化复习计划
    await dbHelpers.initReviewSchedule(card.id);

    return card;
  }

  /**
   * 更新卡片
   */
  static async updateCard(
    id: string,
    input: UpdateCardInput
  ): Promise<Card | undefined> {
    const card = await db.cards.get(id);
    if (!card) {
      throw new Error('卡片不存在');
    }

    const updatedCard: Card = {
      ...card,
      question: input.question ?? card.question,
      answer: input.answer
        ? { ...card.answer, ...input.answer }
        : card.answer,
      tags: input.tags ?? card.tags,
      updatedAt: new Date(),
    };

    await db.cards.put(updatedCard);
    return updatedCard;
  }

  /**
   * 删除卡片
   */
  static async deleteCard(id: string): Promise<void> {
    // 删除卡片
    await db.cards.delete(id);
    // 删除关联的复习计划
    await db.reviewSchedules.delete(id);
  }

  /**
   * 获取单个卡片
   */
  static async getCard(id: string): Promise<Card | undefined> {
    return db.cards.get(id);
  }

  /**
   * 获取所有卡片
   */
  static async getAllCards(): Promise<Card[]> {
    return db.cards.toArray();
  }

  /**
   * 搜索卡片
   */
  static async searchCards(query: string): Promise<Card[]> {
    const allCards = await db.cards.toArray();
    const lowerQuery = query.toLowerCase();

    return allCards.filter(
      (card) =>
        card.question.toLowerCase().includes(lowerQuery) ||
        card.answer.content.toLowerCase().includes(lowerQuery) ||
        card.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 按标签过滤卡片
   */
  static async getCardsByTag(tag: string): Promise<Card[]> {
    return db.cards.where('tags').anyOf([tag]).toArray();
  }

  /**
   * 获取所有标签
   */
  static async getAllTags(): Promise<string[]> {
    const cards = await db.cards.toArray();
    const tagSet = new Set<string>();
    cards.forEach((card) => {
      card.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  /**
   * 获取标签建议（用于 LRU 缓存初始化）
   */
  static async getTagSuggestions(): Promise<Array<{ tags: string[]; updatedAt: Date }>> {
    const cards = await db.cards.toArray();
    return cards.map(card => ({
      tags: card.tags,
      updatedAt: card.updatedAt,
    }));
  }

  /**
   * 获取到期的复习卡片
   */
  static async getDueCards(): Promise<Card[]> {
    return dbHelpers.getDueCards();
  }

  /**
   * 获取今日完成的复习数量
   */
  static async getCompletedTodayCount(): Promise<number> {
    return dbHelpers.getCompletedTodayCount();
  }

  /**
   * 获取记忆保留率
   * 记忆保留率 = (评分 >= 3 的次数 / 总复习次数) * 100
   */
  static async getRetentionRate(): Promise<number> {
    return dbHelpers.getRetentionRate();
  }

  /**
   * 获取本周统计数据
   */
  static async getWeeklyStats(): Promise<{
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  }> {
    return dbHelpers.getWeeklyStats();
  }

  /**
   * 获取每日统计数据（用于图表）
   */
  static async getDailyStats(days: number = 7): Promise<Array<{
    date: string;
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  }>> {
    return dbHelpers.getDailyStats(days);
  }

  /**
   * 批量创建卡片
   */
  static async createCards(inputs: CreateCardInput[]): Promise<Card[]> {
    const cards: Card[] = [];
    for (const input of inputs) {
      const card = await this.createCard(input);
      cards.push(card);
    }
    return cards;
  }

  /**
   * 导出所有卡片数据
   */
  static async exportCards(): Promise<string> {
    const cards = await this.getAllCards();
    return JSON.stringify(cards, null, 2);
  }

  /**
   * 导入卡片数据
   */
  static async importCards(jsonData: string): Promise<Card[]> {
    const cards: Card[] = JSON.parse(jsonData);
    const importedCards: Card[] = [];

    for (const card of cards) {
      // 验证卡片数据
      if (!card.question || !card.answer) {
        continue;
      }

      // 如果卡片已存在，跳过或更新
      const existing = await db.cards.get(card.id);
      if (existing) {
        continue;
      }

      // 创建新卡片
      const newCard: Card = {
        ...card,
        id: card.id || generateId(),
        createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
        updatedAt: new Date(),
      };

      await db.cards.add(newCard);
      await dbHelpers.initReviewSchedule(newCard.id);
      importedCards.push(newCard);
    }

    return importedCards;
  }
}

