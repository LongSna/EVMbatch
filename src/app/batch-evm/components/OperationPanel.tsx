'use client';

import { Address, Transaction } from '../types';
import { DirectOperationPanel } from './DirectOperationPanel';
import { ContractOperationPanel } from './ContractOperationPanel';
import { EIP7702OperationPanel } from './EIP7702OperationPanel';

// 操作面板组件
export function OperationPanel({
  operationType,
  setOperationType,
  contractAddress,
  setContractAddress,
  contractABI,
  setContractABI,
  addresses,
  setTransactions,
  isConnected
}: {
  operationType: 'direct' | 'contract' | 'eip7702';
  setOperationType: (type: 'direct' | 'contract' | 'eip7702') => void;
  contractAddress: string;
  setContractAddress: (address: string) => void;
  contractABI: string;
  setContractABI: (abi: string) => void;
  addresses: Address[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  isConnected: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">批量操作</h2>
      
      {/* 操作类型选择 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">操作类型</h3>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input 
              type="radio" 
              name="operationType"
              value="direct"
              checked={operationType === 'direct'}
              onChange={(e) => setOperationType(e.target.value as 'direct' | 'contract' | 'eip7702')}
              className="mr-2"
            />
            直接操作 (普通EVM交易)
          </label>
          <label className="flex items-center">
            <input 
              type="radio" 
              name="operationType"
              value="contract"
              checked={operationType === 'contract'}
              onChange={(e) => setOperationType(e.target.value as 'direct' | 'contract' | 'eip7702')}
              className="mr-2"
            />
            合约操作 (transferFrom等)
          </label>
          <label className="flex items-center">
            <input 
              type="radio" 
              name="operationType"
              value="eip7702"
              checked={operationType === 'eip7702'}
              onChange={(e) => setOperationType(e.target.value as 'direct' | 'contract' | 'eip7702')}
              className="mr-2"
            />
            EIP-7702 (账户抽象)
          </label>
        </div>
      </div>

      {/* 直接操作面板 */}
      {operationType === 'direct' && (
        <DirectOperationPanel 
          addresses={addresses}
          setTransactions={setTransactions}
          isConnected={isConnected}
        />
      )}

      {/* 合约操作面板 */}
      {operationType === 'contract' && (
        <ContractOperationPanel 
          contractAddress={contractAddress}
          setContractAddress={setContractAddress}
          contractABI={contractABI}
          setContractABI={setContractABI}
          addresses={addresses}
          setTransactions={setTransactions}
          isConnected={isConnected}
        />
      )}

      {/* EIP-7702操作面板 */}
      {operationType === 'eip7702' && (
        <EIP7702OperationPanel 
          addresses={addresses}
          setTransactions={setTransactions}
          isConnected={isConnected}
        />
      )}
    </div>
  );
} 