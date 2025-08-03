'use client';

import { useState } from 'react';
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

  const generateAddresses = () => {
    const newAddresses: Address[] = [];
    for (let i = 0; i < generateCount; i++) {
      const wallet = ethers.Wallet.createRandom();
      newAddresses.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        isSelected: false
      });
    }
    setAddresses([...addresses, ...newAddresses]);
  };

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
              } catch {
                console.error('无效的私钥:', item.privateKey);
              }
            }
          });
          
          if (importedAddresses.length > 0) {
            setAddresses([...addresses, ...importedAddresses]);
            alert(`成功导入 ${importedAddresses.length} 个地址`);
          } else {
            alert('JSON文件中没有找到有效的地址和私钥');
          }
        } else {
          alert('JSON格式错误，请检查文件内容');
        }
      } catch (error) {
        alert('JSON文件解析失败');
        console.error('JSON解析错误:', error);
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
            max="100"
          />
          <button 
            onClick={generateAddresses}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            生成
          </button>
        </div>
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
          导出包含地址和私钥的JSON文件，或从JSON文件导入
        </p>
      </div>

      {/* 地址列表 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">地址列表</h3>
        {addresses.length > 0 && (
          <div className="flex gap-2 mb-2">
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
        )}
        <div className="max-h-60 overflow-y-auto border rounded">
          {addresses.map((address, index) => (
            <div key={index} className="flex items-center p-2 hover:bg-gray-50">
              <input 
                type="checkbox"
                checked={address.isSelected}
                onChange={() => toggleAddressSelection(index)}
                className="mr-2"
              />
              <div className="flex-1">
                <div className="text-sm font-mono">{address.address}</div>
                {address.balance && (
                  <div className="text-xs text-gray-500">
                    余额: {address.balance} ETH
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  私钥: {address.privateKey.substring(0, 10)}...
                </div>
              </div>
              <button 
                onClick={() => removeAddress(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          已选择: {selectedCount} / {addresses.length}
        </div>
      </div>
    </div>
  );
} 