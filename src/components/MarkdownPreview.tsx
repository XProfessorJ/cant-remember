interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * 简单的 Markdown 预览组件
 * 支持基本的 Markdown 语法
 */
export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        暂无内容
      </div>
    );
  }

  // 简单的 Markdown 渲染
  const renderMarkdown = (text: string): string => {
    let html = text;

    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

    // 粗体和斜体
    html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // 代码块
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>');

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // 列表
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\+ (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');

    // 换行
    html = html.replace(/\n/g, '<br>');

    // 包装列表项
    html = html.replace(/(<li class="ml-4">.*<\/li>)/gim, (match) => {
      if (!match.includes('<ul')) {
        return '<ul class="list-disc my-2">' + match + '</ul>';
      }
      return match;
    });

    return html;
  };

  const htmlContent = renderMarkdown(content);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

