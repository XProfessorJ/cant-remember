import { AttachmentFile } from '@/types';

/**
 * 将文件转换为 Base64 字符串
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data URL 前缀，只保留 base64 数据
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将文件转换为 AttachmentFile
 */
export async function fileToAttachment(file: File): Promise<AttachmentFile> {
  const data = await fileToBase64(file);
  return {
    name: file.name,
    type: file.type,
    data: data,
    size: file.size,
  };
}

/**
 * 从 Base64 创建 Blob URL（用于预览）
 */
export function base64ToBlobUrl(base64: string, mimeType: string): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * 从 AttachmentFile 创建 Blob URL
 */
export function attachmentToBlobUrl(attachment: AttachmentFile): string {
  return base64ToBlobUrl(attachment.data, attachment.type);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some(type => {
    if (type.includes('/*')) {
      // 支持通配符，如 'image/*'
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * 获取文件类型图标
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('markdown') || mimeType === 'text/markdown') return '📝';
  if (mimeType.startsWith('text/')) return '📄';
  return '📎';
}

