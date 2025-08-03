'use client';

import { Transaction } from '../types';

// 交易历史组件
export function TransactionHistory({
  transactions,
  setTransactions
}: {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
}) {
  const clearHistory = () => {
    if (window.confirm('确认清空交易历史吗？')) {
      setTransactions([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">交易历史</h2>
        <button 
          onClick={clearHistory}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清空历史
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">时间</th>
              <th className="text-left py-2">类型</th>
              <th className="text-left py-2">发送地址</th>
              <th className="text-left py-2">接收地址</th>
              <th className="text-left py-2">数量</th>
              <th className="text-left py-2">数据</th>
              <th className="text-left py-2">状态</th>
              <th className="text-left py-2">交易哈希</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.type === 'direct' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {tx.type === 'direct' ? '直接交易' : '合约调用'}
                  </span>
                </td>
                <td className="py-2 font-mono text-xs">
                  {tx.from.substring(0, 10)}...{tx.from.substring(tx.from.length - 8)}
                </td>
                <td className="py-2 font-mono text-xs">
                  {tx.to ? (
                    `${tx.to.substring(0, 10)}...${tx.to.substring(tx.to.length - 8)}`
                  ) : (
                    <span className="text-blue-600">创建合约</span>
                  )}
                </td>
                <td className="py-2">{tx.amount} ETH</td>
                <td className="py-2 font-mono text-xs">
                  {tx.data ? (
                    <span className="text-blue-600" title={tx.data}>
                      {tx.data.substring(0, 10)}...
                    </span>
                  ) : (
                    <span className="text-gray-400">无</span>
                  )}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.status === 'success' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status === 'success' ? '成功' :
                     tx.status === 'pending' ? '处理中' : '失败'}
                  </span>
                </td>
                <td className="py-2 font-mono text-xs">
                  {tx.hash !== 'failed' ? (
                    <a 
                      href={`https://etherscan.io/tx/${tx.hash}`} 
                      target="_blank" 
                      className="text-blue-500 hover:underline"
                    >
                      {tx.hash.substring(0, 10)}...
                    </a>
                  ) : (
                    <span className="text-red-500">失败</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无交易记录
          </div>
        )}
      </div>
    </div>
  );
} 