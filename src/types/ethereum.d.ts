// 全局类型定义
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 交易类型
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  type: 'direct' | 'contract';
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  gasUsed?: string;
  gasPrice?: string;
}

// 地址类型
export interface Address {
  address: string;
  privateKey?: string;
  balance?: string;
  isSelected: boolean;
}

// 合约类型
export interface Contract {
  address: string;
  abi: string;
  bytecode?: string;
  name: string;
}

// 操作类型
export type OperationType = 'direct' | 'contract';

// 网络类型
export interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
} 