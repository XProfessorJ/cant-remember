/**
 * 标签 LRU 缓存管理
 * 用于跟踪标签的使用频率和最近使用时间
 * 使用 IndexedDB 存储，方便管理，后期可迁移到 MongoDB
 */

import { TagUsage } from '@/types';
import { db } from './db';

/**
 * LRU 缓存类
 */
export class TagLRUCache {
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * 使用标签（更新 LRU 缓存）
   */
  async useTag(tag: string): Promise<void> {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;

    const now = new Date();
    try {
      const existing = await db.tagUsages.get(trimmedTag);
      
      if (existing) {
        // 更新现有标签
        await db.tagUsages.put({
          tag: trimmedTag,
          count: existing.count + 1,
          lastUsed: now,
        });
      } else {
        // 检查是否超过最大数量
        const allTags = await db.tagUsages.toArray();
        if (allTags.length >= this.maxSize) {
          // 删除最旧的标签（按使用次数和最近使用时间排序）
          const sortedTags = allTags.sort((a, b) => {
            if (a.count !== b.count) {
              return a.count - b.count; // 使用次数少的在前
            }
            return a.lastUsed.getTime() - b.lastUsed.getTime(); // 最近使用时间早的在前
          });
          // 删除最旧的标签
          if (sortedTags.length > 0) {
            await db.tagUsages.delete(sortedTags[0].tag);
          }
        }
        
        // 添加新标签
        await db.tagUsages.add({
          tag: trimmedTag,
          count: 1,
          lastUsed: now,
        });
      }
    } catch (error) {
      console.error('更新标签使用情况失败:', error);
    }
  }

  /**
   * 批量使用标签
   */
  async useTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.useTag(tag)));
  }

  /**
   * 获取标签使用情况
   */
  async getTagUsage(tag: string): Promise<TagUsage | undefined> {
    try {
      return await db.tagUsages.get(tag.trim().toLowerCase());
    } catch (error) {
      console.error('获取标签使用情况失败:', error);
      return undefined;
    }
  }

  /**
   * 获取所有标签（按使用频率和最近使用时间排序）
   */
  async getAllTags(): Promise<TagUsage[]> {
    try {
      const allTags = await db.tagUsages.toArray();
      return allTags.sort((a, b) => {
        // 首先按使用次数排序（降序）
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // 如果使用次数相同，按最近使用时间排序（降序）
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      });
    } catch (error) {
      console.error('获取所有标签失败:', error);
      return [];
    }
  }

  /**
   * 根据输入内容过滤标签
   */
  async filterTags(query: string, limit: number = 10): Promise<TagUsage[]> {
    try {
      const lowerQuery = query.trim().toLowerCase();
      let allTags: TagUsage[];

      if (!lowerQuery) {
        // 如果没有输入，返回最常用的标签
        allTags = await this.getAllTags();
      } else {
        // 获取所有标签，然后过滤
        allTags = await db.tagUsages.toArray();
        allTags = allTags.filter(usage => usage.tag.includes(lowerQuery));
      }

      // 排序
      const sorted = allTags.sort((a, b) => {
        // 优先显示完全匹配的标签
        if (lowerQuery) {
          const aExact = a.tag === lowerQuery;
          const bExact = b.tag === lowerQuery;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
        }
        
        // 然后按使用次数排序
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // 最后按最近使用时间排序
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      });

      return sorted.slice(0, limit);
    } catch (error) {
      console.error('过滤标签失败:', error);
      return [];
    }
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    try {
      await db.tagUsages.clear();
    } catch (error) {
      console.error('清空标签缓存失败:', error);
    }
  }

  /**
   * 从卡片数据初始化缓存
   */
  async initializeFromCards(cards: Array<{ tags: string[]; updatedAt: Date }>): Promise<void> {
    try {
      const tagMap = new Map<string, { count: number; lastUsed: Date }>();
      
      // 统计所有标签的使用情况
      cards.forEach(card => {
        card.tags.forEach(tag => {
          const trimmedTag = tag.trim().toLowerCase();
          if (!trimmedTag) return;
          
          if (tagMap.has(trimmedTag)) {
            const usage = tagMap.get(trimmedTag)!;
            usage.count += 1;
            // 更新为最近的更新时间
            if (card.updatedAt > usage.lastUsed) {
              usage.lastUsed = card.updatedAt;
            }
          } else {
            tagMap.set(trimmedTag, {
              count: 1,
              lastUsed: card.updatedAt,
            });
          }
        });
      });

      // 合并到数据库
      await Promise.all(
        Array.from(tagMap.entries()).map(async ([tag, usage]) => {
          try {
            const existing = await db.tagUsages.get(tag);
            if (existing) {
              // 更新现有标签：使用次数取最大值，最近使用时间取最新的
              await db.tagUsages.put({
                tag,
                count: Math.max(existing.count, usage.count),
                lastUsed: existing.lastUsed > usage.lastUsed ? existing.lastUsed : usage.lastUsed,
              });
            } else {
              // 添加新标签
              await db.tagUsages.add({
                tag,
                count: usage.count,
                lastUsed: usage.lastUsed,
              });
            }
          } catch (error) {
            console.error(`初始化标签 "${tag}" 失败:`, error);
          }
        })
      );
    } catch (error) {
      console.error('从卡片数据初始化标签缓存失败:', error);
    }
  }
}

// 全局单例
export const tagLRUCache = new TagLRUCache(50);

