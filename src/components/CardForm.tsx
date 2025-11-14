import { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CreateCardInput, UpdateCardInput, AttachmentFile } from '@/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Modal } from './ui/Modal';
import { MarkdownPreview } from './MarkdownPreview';
import {
  fileToAttachment,
  validateFileType,
  validateFileSize,
  formatFileSize,
  attachmentToBlobUrl,
  getFileTypeIcon,
} from '@/lib/fileUtils';
import { tagLRUCache } from '@/lib/tagLRU';
import { CardService } from '@/services/cardService';
import { Upload, X, Image as ImageIcon, Mic, FileText, Eye, EyeOff, Tag } from 'lucide-react';

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCardInput | UpdateCardInput) => Promise<void>;
  card?: Card;
  title?: string;
}

type AnswerType = 'text' | 'markdown' | 'audio' | 'image' | 'mixed';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = ['audio/*'];
const ALLOWED_IMAGE_TYPES = ['image/*'];
const ALLOWED_MARKDOWN_TYPES = ['text/markdown', 'text/plain', '.md'];

export function CardForm({
  isOpen,
  onClose,
  onSubmit,
  card,
  title = card ? '编辑卡片' : '创建卡片',
}: CardFormProps) {
  const [question, setQuestion] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [answerType, setAnswerType] = useState<AnswerType>('text');
  const [tags, setTags] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ tag: string; count: number; lastUsed: Date }>>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);

  // 初始化标签 LRU 缓存
  useEffect(() => {
    if (isOpen) {
      // 从数据库初始化标签缓存
      CardService.getTagSuggestions().then(cards => {
        tagLRUCache.initializeFromCards(cards).catch(error => {
          console.error('初始化标签缓存失败:', error);
        });
      });
    }
  }, [isOpen]);

  // 初始化表单数据
  useEffect(() => {
    if (!isOpen) {
      // 关闭时清理所有预览 URL
      previewUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          // 忽略清理错误
        }
      });
      previewUrlsRef.current.clear();
      setPreviewUrls(new Map());
      setShowTagSuggestions(false);
      setTagInputFocused(false);
      return;
    }

    // 设置表单数据
    if (card) {
      setQuestion(card.question || '');
      setAnswerContent(card.answer.content || '');
      setAnswerType((card.answer.type as AnswerType) || 'text');
      setTags(card.tags.join(', ') || '');
      setAttachments(card.answer.attachments || []);
    } else {
      setQuestion('');
      setAnswerContent('');
      setAnswerType('text');
      setTags('');
      setAttachments([]);
    }
    setError('');
    setShowMarkdownPreview(false);

    // 清理旧的预览 URL
    previewUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        // 忽略清理错误
      }
    });
    previewUrlsRef.current.clear();

    // 创建新的预览 URL
    if (card?.answer.attachments && card.answer.attachments.length > 0) {
      const urls = new Map<string, string>();
      card.answer.attachments.forEach(attachment => {
        try {
          const url = attachmentToBlobUrl(attachment);
          urls.set(attachment.name, url);
          previewUrlsRef.current.set(attachment.name, url);
        } catch (err) {
          console.error('Failed to create preview URL:', err);
        }
      });
      setPreviewUrls(urls);
    } else {
      setPreviewUrls(new Map());
    }

    // 组件卸载时清理
    return () => {
      previewUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          // 忽略清理错误
        }
      });
      previewUrlsRef.current.clear();
    };
  }, [card, isOpen]);

  const handleFileUpload = async (
    files: FileList | null,
    allowedTypes: string[]
  ) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 验证文件类型
      if (!validateFileType(file, allowedTypes)) {
        errors.push(`文件 "${file.name}" 类型不支持`);
        continue;
      }

      // 验证文件大小
      if (!validateFileSize(file, MAX_FILE_SIZE)) {
        errors.push(`文件 "${file.name}" 大小超过 ${formatFileSize(MAX_FILE_SIZE)}`);
        continue;
      }

      try {
        const attachment = await fileToAttachment(file);
        newAttachments.push(attachment);

        // 创建预览 URL
        if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
          const url = attachmentToBlobUrl(attachment);
          previewUrlsRef.current.set(file.name, url);
          setPreviewUrls(prev => new Map(prev).set(file.name, url));
        }

        // 如果是 Markdown 文件，读取内容
        if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
          const text = await file.text();
          setAnswerContent(text);
        }
      } catch (err) {
        errors.push(`文件 "${file.name}" 上传失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const attachment = attachments[index];
    // 清理预览 URL
    const url = previewUrlsRef.current.get(attachment.name);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        // 忽略清理错误
      }
      previewUrlsRef.current.delete(attachment.name);
      setPreviewUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(attachment.name);
        return newMap;
      });
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 处理标签输入变化
  const handleTagInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTags(value);
    
    // 解析当前输入，获取最后一个标签部分（用于过滤建议）
    const tagParts = value.split(',').map(t => t.trim());
    const lastTagPart = tagParts[tagParts.length - 1] || '';
    const currentTags = tagParts.slice(0, -1).filter(t => t.length > 0);
    
    // 获取标签建议（基于最后一个标签部分）
    if (tagInputFocused) {
      try {
        const allSuggestions = await tagLRUCache.filterTags(lastTagPart, 20);
        // 过滤掉已经输入的标签
        const filteredSuggestions = allSuggestions.filter(
          suggestion => !currentTags.includes(suggestion.tag.toLowerCase())
        );
        setTagSuggestions(filteredSuggestions.slice(0, 10));
        setShowTagSuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('获取标签建议失败:', error);
        setShowTagSuggestions(false);
      }
    } else {
      setShowTagSuggestions(false);
    }
  };

  // 处理标签输入聚焦
  const handleTagInputFocus = async () => {
    setTagInputFocused(true);
    // 解析当前输入，获取最后一个标签部分
    const tagParts = tags.split(',').map(t => t.trim());
    const lastTagPart = tagParts[tagParts.length - 1] || '';
    const currentTags = tagParts.slice(0, -1).filter(t => t.length > 0);
    
    try {
      // 获取标签建议（基于最后一个标签部分，如果没有则显示最常用的）
      const allSuggestions = await tagLRUCache.filterTags(lastTagPart, 20);
      // 过滤掉已经输入的标签
      const filteredSuggestions = allSuggestions.filter(
        suggestion => !currentTags.includes(suggestion.tag.toLowerCase())
      );
      setTagSuggestions(filteredSuggestions.slice(0, 10));
      setShowTagSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error('获取标签建议失败:', error);
      setShowTagSuggestions(false);
    }
  };

  // 处理标签输入失焦
  const handleTagInputBlur = () => {
    // 延迟隐藏，以便点击标签时不会立即隐藏
    setTimeout(() => {
      if (!tagSuggestionsRef.current?.contains(document.activeElement)) {
        setShowTagSuggestions(false);
        setTagInputFocused(false);
      }
    }, 200);
  };

  // 添加标签到输入框
  const handleAddTag = async (tag: string) => {
    // 解析当前输入，获取已输入的完整标签
    const tagParts = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    // 检查标签是否已存在（不区分大小写）
    const normalizedTags = tagParts.map(t => t.toLowerCase());
    if (normalizedTags.includes(tag.toLowerCase())) {
      return; // 标签已存在，不重复添加
    }
    
    // 添加新标签
    if (tagParts.length > 0) {
      // 如果已有标签，追加新标签
      setTags(`${tags.trim().endsWith(',') ? tags.trim().slice(0, -1) : tags.trim()}, ${tag}`);
    } else {
      // 如果没有标签，直接设置
      setTags(tag);
    }
    
    // 更新 LRU 缓存
    try {
      await tagLRUCache.useTag(tag);
    } catch (error) {
      console.error('更新标签缓存失败:', error);
    }
    
    // 更新标签建议
    try {
      const suggestions = await tagLRUCache.filterTags('', 20);
      // 过滤掉已经输入的标签
      const newNormalizedTags = [...normalizedTags, tag.toLowerCase()];
      const filteredSuggestions = suggestions.filter(
        suggestion => !newNormalizedTags.includes(suggestion.tag)
      );
      setTagSuggestions(filteredSuggestions.slice(0, 10));
    } catch (error) {
      console.error('更新标签建议失败:', error);
    }
    
    // 聚焦到输入框
    setTimeout(() => {
      tagInputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('问题不能为空');
      return;
    }

    // 根据类型验证内容
    if (answerType === 'text' || answerType === 'markdown') {
      if (!answerContent.trim() && attachments.length === 0) {
        setError('答案内容或附件不能为空');
        return;
      }
    } else if (answerType === 'audio' || answerType === 'image') {
      if (attachments.length === 0) {
        setError(`请上传${answerType === 'audio' ? '录音' : '图片'}文件`);
        return;
      }
    } else if (answerType === 'mixed') {
      if (!answerContent.trim() && attachments.length === 0) {
        setError('答案内容或附件不能为空');
        return;
      }
    }

    setLoading(true);
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // 更新 LRU 缓存
      if (tagArray.length > 0) {
        try {
          await tagLRUCache.useTags(tagArray);
        } catch (error) {
          console.error('更新标签缓存失败:', error);
        }
      }

      const input: CreateCardInput | UpdateCardInput = {
        question: question.trim(),
        answer: {
          type: answerType,
          content: answerContent.trim() || '',
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        tags: tagArray,
      };

      await onSubmit(input);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 清理所有预览 URL
    previewUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        // 忽略清理错误
      }
    });
    previewUrlsRef.current.clear();
    
    setQuestion('');
    setAnswerContent('');
    setAnswerType('text');
    setTags('');
    setAttachments([]);
    setError('');
    setShowMarkdownPreview(false);
    setPreviewUrls(new Map());
    onClose();
  };

  const renderAnswerInput = () => {
    switch (answerType) {
      case 'text':
        return (
          <Textarea
            label="答案内容"
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="输入答案内容..."
            rows={8}
          />
        );

      case 'markdown':
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Markdown 内容
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                className="flex items-center gap-1"
              >
                {showMarkdownPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    编辑
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    预览
                  </>
                )}
              </Button>
            </div>
            {showMarkdownPreview ? (
              <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50 overflow-auto">
                <MarkdownPreview content={answerContent} />
              </div>
            ) : (
              <Textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="输入 Markdown 内容...&#10;&#10;支持标题、列表、代码块、链接等"
                rows={10}
                className="font-mono text-sm"
              />
            )}
            <div className="mt-2">
              <input
                ref={markdownInputRef}
                type="file"
                accept=".md,text/markdown,text/plain"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, ALLOWED_MARKDOWN_TYPES)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => markdownInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                上传 Markdown 文件
              </Button>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              录音文件
            </label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, ALLOWED_AUDIO_TYPES)}
              multiple
            />
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => audioInputRef.current?.click()}
            >
              <Mic className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-1">点击上传录音文件</p>
              <p className="text-sm text-gray-500">支持 MP3, WAV, OGG 等格式</p>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment, index) => {
                  const url = previewUrls.get(attachment.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileTypeIcon(attachment.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {url && (
                          <audio controls className="h-8 w-48">
                            <source src={url} type={attachment.type} />
                          </audio>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片文件
            </label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, ALLOWED_IMAGE_TYPES)}
              multiple
            />
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-1">点击上传图片文件</p>
              <p className="text-sm text-gray-500">支持 JPG, PNG, GIF, WebP 等格式</p>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {attachments.map((attachment, index) => {
                  const url = previewUrls.get(attachment.name);
                  return (
                    <div key={index} className="relative group">
                      {url && (
                        <img
                          src={url}
                          alt={attachment.name}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {attachment.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'mixed':
        return (
          <div className="space-y-4">
            <Textarea
              label="答案内容（可选）"
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="输入答案内容..."
              rows={6}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                附件文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,.md,text/markdown,text/plain"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(
                    e.target.files,
                    [...ALLOWED_AUDIO_TYPES, ...ALLOWED_IMAGE_TYPES, ...ALLOWED_MARKDOWN_TYPES]
                  )
                }
                multiple
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">点击上传文件</p>
                <p className="text-sm text-gray-500">支持图片、录音、Markdown 文件</p>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((attachment, index) => {
                    const url = previewUrls.get(attachment.name);
                    const isImage = attachment.type.startsWith('image/');
                    const isAudio = attachment.type.startsWith('audio/');
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getFileTypeIcon(attachment.type)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isImage && url && (
                            <img
                              src={url}
                              alt={attachment.name}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                          )}
                          {isAudio && url && (
                            <audio controls className="h-8 w-32">
                              <source src={url} type={attachment.type} />
                            </audio>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="问题"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="输入问题..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            答案类型
          </label>
          <select
            value={answerType}
            onChange={(e) => {
              setAnswerType(e.target.value as AnswerType);
              // 切换类型时清空内容（可选）
              if (e.target.value !== answerType) {
                setAnswerContent('');
                setAttachments([]);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="text">文本</option>
            <option value="markdown">Markdown</option>
            <option value="audio">录音</option>
            <option value="image">图片</option>
            <option value="mixed">混合</option>
          </select>
        </div>

        {renderAnswerInput()}

        <div className="relative">
          <Input
            ref={tagInputRef}
            label="标签（用逗号分隔）"
            value={tags}
            onChange={handleTagInputChange}
            onFocus={handleTagInputFocus}
            onBlur={handleTagInputBlur}
            placeholder="例如: 数学, 概念, 重要"
          />
          
          {/* 标签建议列表 */}
          {showTagSuggestions && tagSuggestions.length > 0 && (
            <div
              ref={tagSuggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // 防止输入框失焦
            >
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 px-2">建议标签（点击添加）</div>
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((suggestion) => {
                    // 解析当前输入，获取已输入的标签
                    const tagParts = tags.split(',').map(t => t.trim().toLowerCase());
                    const allCurrentTags = tagParts.filter(t => t.length > 0);
                    const isSelected = allCurrentTags.includes(suggestion.tag);
                    
                    return (
                      <button
                        key={suggestion.tag}
                        type="button"
                        onClick={() => handleAddTag(suggestion.tag)}
                        disabled={isSelected}
                        onMouseDown={(e) => e.preventDefault()} // 防止输入框失焦
                        className={`
                          inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                          ${isSelected
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-100 text-primary-800 hover:bg-primary-200 cursor-pointer'
                          }
                        `}
                        title={`使用次数: ${suggestion.count}${suggestion.lastUsed ? ` | 最近使用: ${new Date(suggestion.lastUsed).toLocaleDateString('zh-CN')}` : ''}`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{suggestion.tag}</span>
                        {suggestion.count > 1 && (
                          <span className="text-xs opacity-75">({suggestion.count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
