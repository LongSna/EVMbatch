// 类型定义
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
  data?: string; // 新增：自定义十六进制数据
}

export interface Address {
  address: string;
  privateKey: string; // 私钥现在是必需的
  balance?: string;
  isSelected: boolean;
} 