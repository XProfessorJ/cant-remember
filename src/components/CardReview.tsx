import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { attachmentToBlobUrl, getFileTypeIcon } from '@/lib/fileUtils';
import { Card as CardType, PerformanceRating } from '@/types';
import { Eye } from 'lucide-react';

interface CardReviewProps {
  card: CardType;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onRating: (rating: PerformanceRating) => Promise<void>;
  isReviewing?: boolean;
  ratingSuccess?: boolean;
  showSuccessMessage?: boolean;
  actions?: ReactNode; // 自定义操作按钮区域
  header?: ReactNode; // 自定义头部区域（如进度条、序号等）
  footer?: ReactNode; // 自定义底部区域（如跳过按钮等）
}

export function CardReview({
  card,
  showAnswer,
  onShowAnswer,
  onRating,
  isReviewing = false,
  ratingSuccess = false,
  showSuccessMessage = false,
  actions,
  header,
  footer,
}: CardReviewProps) {
  // 渲染答案内容
  const renderAnswer = () => {
    if (!showAnswer) return null;

    return (
      <div className="mb-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">答案：</h3>
        
        {/* 文本内容 */}
        {card.answer.type === 'text' && (
          <div className="text-gray-600 whitespace-pre-wrap">
            {card.answer.content}
          </div>
        )}

        {/* Markdown 内容 */}
        {card.answer.type === 'markdown' && (
          <div className="prose prose-sm max-w-none">
            <MarkdownPreview content={card.answer.content} />
          </div>
        )}

        {/* 图片内容 */}
        {card.answer.type === 'image' && card.answer.attachments && (
          <div className="space-y-4">
            {card.answer.attachments.map((attachment, index) => {
              try {
                const url = attachmentToBlobUrl(attachment);
                return (
                  <div key={index}>
                    <img
                      src={url}
                      alt={attachment.name}
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-2">{attachment.name}</p>
                  </div>
                );
              } catch (err) {
                return (
                  <div key={index} className="text-red-500 text-sm">
                    无法加载图片: {attachment.name}
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* 录音内容 */}
        {card.answer.type === 'audio' && card.answer.attachments && (
          <div className="space-y-4">
            {card.answer.attachments.map((attachment, index) => {
              try {
                const url = attachmentToBlobUrl(attachment);
                return (
                  <div key={index}>
                    <audio controls className="w-full">
                      <source src={url} type={attachment.type} />
                      您的浏览器不支持音频播放
                    </audio>
                    <p className="text-sm text-gray-500 mt-2">{attachment.name}</p>
                  </div>
                );
              } catch (err) {
                return (
                  <div key={index} className="text-red-500 text-sm">
                    无法加载音频: {attachment.name}
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* 混合内容 */}
        {card.answer.type === 'mixed' && (
          <div className="space-y-4">
            {/* 文本内容 */}
            {card.answer.content && (
              <div className="text-gray-600 whitespace-pre-wrap">
                {card.answer.content}
              </div>
            )}

            {/* 附件 */}
            {card.answer.attachments && card.answer.attachments.length > 0 && (
              <div className="space-y-4">
                {card.answer.attachments.map((attachment, index) => {
                  try {
                    const url = attachmentToBlobUrl(attachment);
                    const isImage = attachment.type.startsWith('image/');
                    const isAudio = attachment.type.startsWith('audio/');
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getFileTypeIcon(attachment.type)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {attachment.name}
                          </span>
                        </div>
                        
                        {isImage && (
                          <img
                            src={url}
                            alt={attachment.name}
                            className="max-w-full h-auto rounded-lg"
                          />
                        )}
                        
                        {isAudio && (
                          <audio controls className="w-full">
                            <source src={url} type={attachment.type} />
                            您的浏览器不支持音频播放
                          </audio>
                        )}
                      </div>
                    );
                  } catch (err) {
                    return (
                      <div key={index} className="text-red-500 text-sm">
                        无法加载附件: {attachment.name}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-8 md:p-12">
      {/* 自定义头部 */}
      {header}

      {/* 问题 */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {card.question}
        </h2>
      </div>

      {/* 答案 */}
      {renderAnswer()}

      {/* 操作按钮 */}
      {!showAnswer ? (
        <Button
          variant="primary"
          size="lg"
          onClick={onShowAnswer}
          className="w-full"
        >
          <Eye className="w-5 h-5 mr-2" />
          显示答案
        </Button>
      ) : (
        <div className="space-y-4">
          {/* 评分成功提示 */}
          {showSuccessMessage && ratingSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm text-center">
              ✓ 复习记录已保存
            </div>
          )}

          {/* 评分按钮 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={rating >= 3 ? 'primary' : 'outline'}
                size="lg"
                onClick={() => onRating(rating as PerformanceRating)}
                disabled={isReviewing}
                className="flex flex-col items-center py-4"
              >
                <span className="text-2xl font-bold">{rating}</span>
                <span className="text-xs mt-1">
                  {rating === 0 && '完全忘记'}
                  {rating === 1 && '几乎忘记'}
                  {rating === 2 && '困难'}
                  {rating === 3 && '一般'}
                  {rating === 4 && '容易'}
                  {rating === 5 && '很简单'}
                </span>
              </Button>
            ))}
          </div>

          {/* 加载提示 */}
          {isReviewing && (
            <p className="text-sm text-center text-gray-500">
              正在记录复习...
            </p>
          )}

          {/* 自定义操作按钮 */}
          {actions}

          {/* 自定义底部 */}
          {footer}
        </div>
      )}
    </Card>
  );
}

