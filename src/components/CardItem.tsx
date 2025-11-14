import { Card as CardType } from '@/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { MarkdownPreview } from './MarkdownPreview';
import { getFileTypeIcon } from '@/lib/fileUtils';
import { Edit, Trash2, Tag } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface CardItemProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (id: string) => void;
  onClick?: (card: CardType) => void;
}

export function CardItem({ card, onEdit, onDelete, onClick }: CardItemProps) {
  return (
    <Card
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(card)}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        {/* 内容区域 - 允许收缩，最小宽度为0以支持文本溢出 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* 问题标题 - 限制最多显示2行 */}
          <h3 
            className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words"
            title={card.question}
          >
            {card.question}
          </h3>
          
          {/* 答案内容预览 */}
          <div className="text-sm text-gray-600 mb-3">
            {card.answer.type === 'text' && (
              <p 
                className="line-clamp-2 break-words"
                title={card.answer.content}
              >
                {card.answer.content}
              </p>
            )}
            {card.answer.type === 'markdown' && (
              <div className="line-clamp-2 break-words">
                <MarkdownPreview content={card.answer.content} />
              </div>
            )}
            {card.answer.type === 'image' && (
              <div className="flex items-center gap-2">
                <span className="text-xl">🖼️</span>
                <span>
                  {card.answer.attachments?.length || 0} 张图片
                </span>
              </div>
            )}
            {card.answer.type === 'audio' && (
              <div className="flex items-center gap-2">
                <span className="text-xl">🎵</span>
                <span>
                  {card.answer.attachments?.length || 0} 个录音
                </span>
              </div>
            )}
            {card.answer.type === 'mixed' && (
              <div className="space-y-1">
                {card.answer.content && (
                  <p 
                    className="line-clamp-2 break-words"
                    title={card.answer.content}
                  >
                    {card.answer.content}
                  </p>
                )}
                {card.answer.attachments && card.answer.attachments.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {card.answer.attachments.slice(0, 3).map((attachment, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]"
                        title={attachment.name}
                      >
                        <span className="flex-shrink-0">{getFileTypeIcon(attachment.type)}</span>
                        <span className="truncate">{attachment.name}</span>
                      </span>
                    ))}
                    {card.answer.attachments.length > 3 && (
                      <span className="text-xs text-gray-500">
                        等 {card.answer.attachments.length} 个文件
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 标签 */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 max-w-[120px] sm:max-w-[150px]"
                title={tag}
              >
                <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{tag}</span>
              </span>
            ))}
          </div>
          
          {/* 创建时间 */}
          <p className="text-xs text-gray-400">
            {formatRelativeTime(card.createdAt)}
          </p>
        </div>
        
        {/* 操作按钮区域 - 不允许收缩，始终可见 */}
        {/* 在小屏幕上，按钮显示在顶部右侧；在大屏幕上，显示在右侧 */}
        <div className="flex space-x-2 flex-shrink-0 sm:self-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="flex-shrink-0"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定要删除这张卡片吗？')) {
                onDelete(card.id);
              }
            }}
            className="flex-shrink-0"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

