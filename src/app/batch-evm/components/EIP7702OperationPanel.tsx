'use client';

import { Address, Transaction } from '../types';

// EIP-7702操作面板组件
export function EIP7702OperationPanel({
  addresses,
  setTransactions,
  isConnected
}: {
  addresses: Address[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  isConnected: boolean;
}) {
  const selectedAddresses = addresses.filter(addr => addr.isSelected);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">EIP-7702 账户抽象</h3>
      
     

      {/* EIP-7702功能说明 */}
      <div className="border rounded p-4 bg-yellow-50">
        <h4 className="font-semibold mb-2 text-yellow-800">EIP-7702 账户抽象</h4>
        <div className="text-sm text-yellow-700">
          <p className="mb-2">EIP-7702 是一个关于账户抽象的提案，目前正在开发中...</p>
          <ul className="list-disc list-inside space-y-1">
            <li>账户抽象化</li>            
            <li>批量操作支持</li>
            <li>批量交易处理</li>            
          </ul>
        </div>
      </div>



      {/* 开发状态提示 */}
      <div className="border rounded p-4 bg-yellow-100">
        <div className="flex items-center">
          <div className="text-yellow-800 text-lg mr-2">⚠️</div>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">此功能正在开发中</p>
            <p className="text-xs mt-1">「新建文件夹」</p>
          </div>
        </div>
      </div>

      {/* 调试信息 */}
      <div className="text-sm text-gray-600 space-y-1">
        <div>钱包连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</div>
        <div>已选择地址数量: {selectedAddresses.length}</div>
        {!isConnected && (
          <div className="text-red-600">⚠️ 请先点击右上角的"连接钱包"按钮</div>
        )}
        {isConnected && selectedAddresses.length === 0 && (
          <div className="text-red-600">⚠️ 请在左侧地址管理中选择要操作的地址</div>
        )}
      </div>
    </div>
  );
} 