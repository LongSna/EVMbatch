'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Address } from '../types';

// 地址管理组件
export function AddressManager({ 
  addresses, 
  setAddresses 
}: { 
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
}) {
  const [generateCount, setGenerateCount] = useState(5);
  const [importText, setImportText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // 非阻塞的地址生成函数
  const generateAddresses = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const newAddresses: Address[] = [];
    const batchSize = 10; // 增大批次大小，提高并行度
    const totalBatches = Math.ceil(generateCount / batchSize);
    
    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        const currentBatchSize = Math.min(batchSize, generateCount - batch * batchSize);
        
        // 并行处理当前批次，但分批让出主线程
        const batchPromises = Array.from({ length: currentBatchSize }, async (_, index) => {
          // 每5个任务让出一次主线程
          if (index % 2 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          const wallet = ethers.Wallet.createRandom();
          return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            isSelected: false
          };
        });
        
        const batchResults = await Promise.all(batchPromises);
        newAddresses.push(...batchResults);
        
        // 更新进度
        const progress = ((batch + 1) / totalBatches) * 100;
        setGenerationProgress(progress);
        
        // 实时更新地址列表
        setAddresses([...addresses, ...newAddresses]);
        
        // 批次间短暂延迟，让UI有机会更新
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      alert(`成功生成 ${newAddresses.length} 个地址`);
    } catch (error) {
      console.error('生成地址时出错:', error);
      alert('生成地址时出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [generateCount, addresses, setAddresses, isGenerating]);

  const importFromPrivateKeys = () => {
    const lines = importText.split('\n').filter(line => line.trim());
    const newAddresses: Address[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      try {
        // 尝试从私钥创建钱包
        const wallet = new ethers.Wallet(trimmed);
        newAddresses.push({
          address: wallet.address,
          privateKey: wallet.privateKey,
          isSelected: false
        });
      } catch {
        console.error('无效的私钥:', trimmed);
        // 可以添加错误提示
      }
    }
    
    if (newAddresses.length > 0) {
      setAddresses([...addresses, ...newAddresses]);
      setImportText('');
      alert(`成功导入 ${newAddresses.length} 个地址`);
    } else {
      alert('没有找到有效的私钥');
    }
  };

  const exportToJSON = () => {
    if (addresses.length === 0) {
      alert('没有地址可导出');
      return;
    }

    const exportData = {
      addresses: addresses.map(addr => ({
        address: addr.address,
        privateKey: addr.privateKey,
        balance: addr.balance || '0'
      })),
      exportTime: new Date().toISOString(),
      totalCount: addresses.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // 生成带时间戳的文件名
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // 格式: 2024-01-15T10-30-45
    const dateStr = now.toISOString().split('T')[0]; // 格式: 2024-01-15
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `evm-addresses-${dateStr}-${timestamp}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const importedAddresses: Address[] = [];
        
        if (jsonData.addresses && Array.isArray(jsonData.addresses)) {
          jsonData.addresses.forEach((item: { address?: string; privateKey?: string; balance?: string }) => {
            if (item.address && item.privateKey) {
              try {
                const wallet = new ethers.Wallet(item.privateKey);
                // 验证私钥和地址是否匹配
                if (wallet.address.toLowerCase() === item.address.toLowerCase()) {
                  importedAddresses.push({
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    balance: item.balance || '0',
                    isSelected: false
                  });
                }
              } catch (error) {
                console.error('无效的私钥:', item.privateKey);
              }
            }
          });
        }
        
        if (importedAddresses.length > 0) {
          setAddresses([...addresses, ...importedAddresses]);
          alert(`成功导入 ${importedAddresses.length} 个地址`);
        } else {
          alert('没有找到有效的地址数据');
        }
      } catch (error) {
        console.error('解析JSON文件失败:', error);
        alert('解析JSON文件失败');
      }
    };
    reader.readAsText(file);
  };

  const toggleAddressSelection = (index: number) => {
    const newAddresses = [...addresses];
    newAddresses[index].isSelected = !newAddresses[index].isSelected;
    setAddresses(newAddresses);
  };

  const selectAllAddresses = () => {
    const newAddresses = addresses.map(addr => ({ ...addr, isSelected: true }));
    setAddresses(newAddresses);
  };

  const deselectAllAddresses = () => {
    const newAddresses = addresses.map(addr => ({ ...addr, isSelected: false }));
    setAddresses(newAddresses);
  };

  const removeAddress = (index: number) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(newAddresses);
  };

  const selectedCount = addresses.filter(addr => addr.isSelected).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">地址管理</h2>
      
      {/* 批量生成地址 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">批量生成地址</h3>
        <div className="flex gap-2 mb-3">
          <input 
            type="number" 
            placeholder="生成数量"
            value={generateCount}
            onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
            className="flex-1 px-3 py-2 border rounded"
            min="1"
            max="1000"
            disabled={isGenerating}
          />
          <button 
            onClick={generateAddresses}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? '生成中...' : '生成'}
          </button>
        </div>
        
        {/* 进度条 */}
        {isGenerating && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              生成进度: {Math.round(generationProgress)}%
            </p>
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          生成的钱包包含私钥，请妥善保管
        </p>
      </div>

      {/* 导入私钥 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">导入私钥</h3>
        <textarea 
          placeholder="每行一个私钥（0x开头或不带0x都可以）"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-32 px-3 py-2 border rounded resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button 
            onClick={importFromPrivateKeys}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            导入私钥
          </button>
          <button 
            onClick={() => setImportText('')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            清空
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          从私钥自动生成对应的地址
        </p>
      </div>

      {/* JSON导入导出 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">JSON导入导出</h3>
        <div className="flex gap-2">
          <button 
            onClick={exportToJSON}
            disabled={addresses.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            导出JSON
          </button>
          <label className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer">
            导入JSON
            <input 
              type="file" 
              accept=".json"
              onChange={importFromJSON}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          支持导入导出地址和私钥信息
        </p>
      </div>

      {/* 地址列表 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            地址列表 ({addresses.length})
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={selectAllAddresses}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              全选
            </button>
            <button 
              onClick={deselectAllAddresses}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              取消全选
            </button>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <div className="mb-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
            已选择 {selectedCount} 个地址
          </div>
        )}
        
        <div className="max-h-60 overflow-y-auto border rounded">
          {addresses.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              暂无地址，请先生成或导入地址
            </div>
          ) : (
            addresses.map((addr, index) => (
              <div 
                key={index} 
                className={`p-3 border-b last:border-b-0 flex items-center justify-between ${
                  addr.isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={addr.isSelected}
                      onChange={() => toggleAddressSelection(index)}
                      className="mr-2"
                    />
                    <span className="font-mono text-sm">{addr.address}</span>
                  </div>
                  {addr.balance && (
                    <div className="text-xs text-gray-500 mt-1">
                      余额: {addr.balance} ETH
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeAddress(index)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 
