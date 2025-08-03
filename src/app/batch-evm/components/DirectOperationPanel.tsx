'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { Address, Transaction } from '../types';

// 直接操作组件
export function DirectOperationPanel({
  addresses,
  setTransactions,
  isConnected
}: {
  addresses: Address[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  isConnected: boolean;
}) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('20');
  const [gasLimit, setGasLimit] = useState('21000');
  const [customData, setCustomData] = useState(''); // 新增：自定义十六进制数据
  const [estimatedGasPrice, setEstimatedGasPrice] = useState('');
  const [estimatedGasLimit, setEstimatedGasLimit] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);

  const selectedAddresses = addresses.filter(addr => addr.isSelected);

  // 估算gas价格和gas限制
  const estimateGas = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (selectedAddresses.length === 0) {
      alert('请选择要操作的地址');
      return;
    }

    if (!amount || parseFloat(amount) < 0) {
      alert('请输入有效的发送数量');
      return;
    }

    setIsEstimating(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // 使用第一个选中的地址作为from地址
      const fromAddress = selectedAddresses[0].address;
      
      // 构建交易对象用于估算
      const txParams: any = {
        from: fromAddress,
        value: ethers.utils.parseEther(amount),
      };
      
      // 只有当接收地址不为空时才设置to字段
      if (recipient && recipient.trim()) {
        txParams.to = recipient;
      }
      
      // 如果设置了自定义数据，则添加到交易中
      if (customData && customData.trim()) {
        let data = customData.trim();
        if (!data.startsWith('0x')) {
          data = '0x' + data;
        }
        if (!/^0x[0-9a-fA-F]*$/.test(data)) {
          throw new Error('自定义数据必须是有效的十六进制格式');
        }
        txParams.data = data;
      }

      // 估算gas限制
      const estimatedGasLimit = await provider.estimateGas(txParams);
      setEstimatedGasLimit(estimatedGasLimit.toString());

      // 获取当前gas价格
      const gasPrice = await provider.getGasPrice();
      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
      setEstimatedGasPrice(gasPriceGwei);

      alert(`估算完成！\n建议Gas价格: ${gasPriceGwei} Gwei\n建议Gas限制: ${estimatedGasLimit.toString()}`);
      
    } catch (error) {
      console.error('估算gas失败:', error);
      alert(`估算失败: ${error instanceof Error ? error.message : '未知错误'}`);
      // 清空估算结果
      setEstimatedGasPrice('');
      setEstimatedGasLimit('');
    } finally {
      setIsEstimating(false);
    }
  };

  const batchSendETH = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (selectedAddresses.length === 0) {
      alert('请选择要操作的地址');
      return;
    }

    if (!amount || parseFloat(amount) <0) {
      alert('请输入有效的发送数量');
      return;
    }

    const totalAmount = parseFloat(amount) * selectedAddresses.length;
    const confirmed = window.confirm(
      `确认要执行批量发送吗？\n` +
      `涉及地址数量: ${selectedAddresses.length}\n` +
      `每个地址发送: ${amount} ETH\n` +
      `总金额: ${totalAmount} ETH`
    );

    if (!confirmed) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const newTransactions: Transaction[] = [];

    for (const address of selectedAddresses) {
      try {
        // 使用私钥创建钱包
        const wallet = new ethers.Wallet(address.privateKey, provider);
        
        // 构建交易对象
        const txParams: any = {
          value: ethers.utils.parseEther(amount),
          gasPrice: ethers.utils.parseUnits(gasPrice, 'gwei'),
          gasLimit: parseInt(gasLimit)
        };
        
        // 只有当接收地址不为空时才设置to字段
        if (recipient && recipient.trim()) {
          txParams.to = recipient;
        }
        
        // 如果设置了自定义数据，则添加到交易中
        if (customData && customData.trim()) {
          // 确保数据是有效的十六进制格式
          let data = customData.trim();
          if (!data.startsWith('0x')) {
            data = '0x' + data;
          }
          // 验证十六进制格式
          if (!/^0x[0-9a-fA-F]*$/.test(data)) {
            throw new Error('自定义数据必须是有效的十六进制格式');
          }
          txParams.data = data;
        }

        const tx = await wallet.sendTransaction(txParams);

        const transaction: Transaction = {
          hash: tx.hash,
          from: address.address,
          to: recipient || '', // 如果接收地址为空，则to字段也为空
          amount,
          type: 'direct',
          status: 'pending',
          timestamp: new Date().toISOString(),
          gasPrice,
          gasUsed: gasLimit,
          data: customData || undefined // 添加自定义数据
        };

        newTransactions.push(transaction);
        
        // 等待交易确认
        const receipt = await tx.wait();
        transaction.status = 'success';
        transaction.gasUsed = receipt.gasUsed.toString();
        
      } catch (error) {
        console.error(`Failed to send from ${address.address}:`, error);
        newTransactions.push({
          hash: 'failed',
          from: address.address,
          to: recipient || '', // 如果接收地址为空，则to字段也为空
          amount,
          type: 'direct',
          status: 'failed',
          timestamp: new Date().toISOString(),
          data: customData || undefined // 添加自定义数据
        });
      }
    }

    setTransactions((prev: Transaction[]) => [...prev, ...newTransactions]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">直接EVM操作</h3>
      
      {/* 交易参数 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">接收地址 (可选)</label>
          <input 
            type="text"
            placeholder="0x... (留空将创建合约)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">发送数量 (ETH)</label>
          <input 
            type="number"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="0.000001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Gas价格 (Gwei)</label>
          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="20"
              value={gasPrice}
              onChange={(e) => setGasPrice(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button 
              onClick={estimateGas}
              disabled={!isConnected || selectedAddresses.length === 0 || isEstimating}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              {isEstimating ? '估算中...' : '估算'}
            </button>
            {estimatedGasPrice && (
              <button 
                onClick={() => setGasPrice(estimatedGasPrice)}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                title="应用估算的Gas价格"
              >
                应用
              </button>
            )}
          </div>
          {estimatedGasPrice && (
            <p className="text-xs text-green-600 mt-1">
              建议Gas价格: {estimatedGasPrice} Gwei
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Gas限制</label>
          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="21000"
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            {estimatedGasLimit && (
              <button 
                onClick={() => setGasLimit(estimatedGasLimit)}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                title="应用估算的Gas限制"
              >
                应用
              </button>
            )}
          </div>
          {estimatedGasLimit && (
            <p className="text-xs text-green-600 mt-1">
              建议Gas限制: {estimatedGasLimit}
            </p>
          )}
        </div>
      </div>

      {/* 自定义数据 */}
      <div>
        <label className="block text-sm font-medium mb-1">自定义数据 (十六进制)</label>
        <textarea 
          placeholder="0x... (可选，用于合约调用或自定义数据)"
          value={customData}
          onChange={(e) => setCustomData(e.target.value)}
          className="w-full h-20 px-3 py-2 border rounded resize-none font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          输入十六进制数据
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button 
          onClick={batchSendETH}
          disabled={!isConnected || selectedAddresses.length === 0}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          批量发送 ({selectedAddresses.length} 个地址)
        </button>
      </div>

      {/* 调试信息 */}
      <div className="text-sm text-gray-600 space-y-1">
        <div>钱包连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</div>
        <div>已选择地址数量: {selectedAddresses.length}</div>
        <div>接收地址: {recipient || '未设置 (将创建合约)'}</div>
        <div>自定义数据: {customData ? `✅ 已设置 (${customData.length} 字符)` : '❌ 未设置'}</div>
        <div>Gas估算: {isEstimating ? '⏳ 估算中...' : estimatedGasPrice ? '✅ 已估算' : '❌ 未估算'}</div>
        {estimatedGasPrice && (
          <div>建议Gas价格: {estimatedGasPrice} Gwei</div>
        )}
        {estimatedGasLimit && (
          <div>建议Gas限制: {estimatedGasLimit}</div>
        )}
        {!isConnected && (
          <div className="text-red-600">⚠️ 请先点击右上角的"连接钱包"按钮</div>
        )}
        {isConnected && selectedAddresses.length === 0 && (
          <div className="text-red-600">⚠️ 请在左侧地址管理中选择要操作的地址</div>
        )}
      </div>

      {selectedAddresses.length > 0 && (
        <div className="text-sm text-gray-600">
          已选择 {selectedAddresses.length} 个地址进行批量操作
        </div>
      )}
    </div>
  );
} 