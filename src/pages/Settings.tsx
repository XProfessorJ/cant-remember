import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardService } from '@/services/cardService';

export function Settings() {
  const handleExport = async () => {
    try {
      const data = await CardService.exportCards();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cards-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = await CardService.importCards(text);
        alert(`成功导入 ${imported.length} 张卡片`);
        window.location.reload();
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败');
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
          <p className="text-gray-600">管理应用设置和数据</p>
        </div>

        <div className="space-y-6">
          {/* 数据管理 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">数据管理</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">导出所有卡片数据</p>
                <Button variant="outline" onClick={handleExport}>
                  导出数据
                </Button>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">导入卡片数据</p>
                <Button variant="outline" onClick={handleImport}>
                  导入数据
                </Button>
              </div>
            </div>
          </Card>

          {/* 算法设置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">复习算法设置</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                当前使用 SM-2 间隔重复算法。算法参数将在后续版本中支持自定义。
              </p>
            </div>
          </Card>

          {/* 通知设置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">通知设置</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                通知功能将在后续版本中实现。
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

