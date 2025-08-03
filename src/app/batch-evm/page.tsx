'use client';

import { useState } from 'react';
import { Address, Transaction } from './types';
import { AddressManager } from './components/AddressManager';
import { OperationPanel } from './components/OperationPanel';
import { TransactionHistory } from './components/TransactionHistory';

export default function BatchEVMPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [operationType, setOperationType] = useState<'direct' | 'contract' | 'eip7702'>('direct');
  const [contractAddress, setContractAddress] = useState('');
  const [contractABI, setContractABI] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">批量EVM地址操控</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={connectWallet}
                className={`px-4 py-2 rounded font-medium ${
                  isConnected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isConnected ? '已连接' : '连接钱包'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：地址管理 */}
          <div className="lg:col-span-1">
            <AddressManager 
              addresses={addresses}
              setAddresses={setAddresses}
            />
          </div>
          
          {/* 右侧：操作面板 */}
          <div className="lg:col-span-2">
            <OperationPanel 
              operationType={operationType}
              setOperationType={setOperationType}
              contractAddress={contractAddress}
              setContractAddress={setContractAddress}
              contractABI={contractABI}
              setContractABI={setContractABI}
              addresses={addresses}
              setTransactions={setTransactions}
              isConnected={isConnected}
            />
          </div>
        </div>

        {/* 交易历史 */}
        <TransactionHistory 
          transactions={transactions}
          setTransactions={setTransactions}
        />
      </div>
    </div>
  );

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    } else {
      alert('请安装MetaMask钱包');
    }
  }
} 