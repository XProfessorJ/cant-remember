// 知识卡片类型
export interface Card {
  id: string;
  question: string;
  answer: {
    type: 'text' | 'markdown' | 'audio' | 'image' | 'mixed';
    content: string; // 文本内容、Markdown内容或文件路径
    attachments?: AttachmentFile[]; // 附件文件（图片、录音、Markdown文件等）
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 附件文件类型
export interface AttachmentFile {
  name: string; // 文件名
  type: string; // MIME类型
  data: string; // Base64 编码的数据或 Blob URL
  size: number; // 文件大小（字节）
}

// 复习计划类型
export interface ReviewSchedule {
  cardId: string;
  dueDate: Date; // 下次复习时间
  interval: number; // 当前间隔天数
  repetitions: number; // 已复习次数
  easeFactor: number; // 难度系数（默认2.5）
  performanceHistory: PerformanceRating[]; // 历史评分
  lastReviewed?: Date; // 上次复习时间
}

// 自评分数类型
export type PerformanceRating = 0 | 1 | 2 | 3 | 4 | 5;

// 学习统计类型
export interface LearningStats {
  dailyReviewCount: number;
  retentionRate: number; // 记忆保留率
  totalCards: number;
  dueCards: number;
  weeklyProgress: {
    newCards: number;
    reviewsCompleted: number;
    averageRating: number;
  };
}

// 创建卡片的输入类型
export interface CreateCardInput {
  question: string;
  answer: {
    type: 'text' | 'markdown' | 'audio' | 'image' | 'mixed';
    content: string;
    attachments?: AttachmentFile[];
  };
  tags?: string[];
}

// 更新卡片的输入类型
export interface UpdateCardInput {
  question?: string;
  answer?: {
    type?: 'text' | 'markdown' | 'audio' | 'image' | 'mixed';
    content?: string;
    attachments?: AttachmentFile[];
  };
  tags?: string[];
}

// 复习结果类型
export interface ReviewResult {
  cardId: string;
  rating: PerformanceRating;
  reviewedAt: Date;
}

// 标签使用情况类型（用于 LRU 缓存）
export interface TagUsage {
  tag: string; // 标签名称（主键，小写）
  count: number; // 使用次数
  lastUsed: Date; // 最近使用时间
}

