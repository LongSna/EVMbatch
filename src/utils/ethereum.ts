"use client";
import { ethers } from 'ethers';
import { Address, Transaction, Network } from '../types/ethereum';

// 支持的网络配置
export const SUPPORTED_NETWORKS: Network[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
    explorerUrl: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
];

// 验证以太坊地址
export function validateAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

// 验证私钥
export function validatePrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

// 生成随机地址
export function generateRandomAddress(): Address {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    isSelected: false
  };
}

// 批量生成地址
export function generateMultipleAddresses(count: number): Address[] {
  const addresses: Address[] = [];
  for (let i = 0; i < count; i++) {
    addresses.push(generateRandomAddress());
  }
  return addresses;
}

// 解析导入的地址
export function parseImportedAddresses(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const addresses: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (validateAddress(trimmed)) {
      addresses.push(trimmed);
    }
  }
  
  return addresses;
}

// 获取地址余额
export async function getAddressBalance(address: string, provider: ethers.providers.Provider): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('获取余额失败:', error);
    return '0';
  }
}

// 估算Gas费用
export async function estimateGas(
  from: string,
  to: string,
  amount: string,
  provider: ethers.providers.Provider
): Promise<{ gasLimit: string; gasPrice: string }> {
  try {
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await provider.estimateGas({
      from,
      to,
      value: ethers.utils.parseEther(amount)
    });
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
    };
  } catch (error) {
    console.error('估算Gas失败:', error);
    return {
      gasLimit: '21000',
      gasPrice: '20'
    };
  }
}

// 发送ETH交易
export async function sendETH(
  fromAddress: string,
  toAddress: string,
  amount: string,
  gasPrice: string,
  gasLimit: string,
  signer: ethers.Signer
): Promise<ethers.providers.TransactionResponse> {
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: ethers.utils.parseEther(amount),
    gasPrice: ethers.utils.parseUnits(gasPrice, 'gwei'),
    gasLimit: parseInt(gasLimit)
  });
  
  return tx;
}

// 调用合约函数
export async function callContract(
  contractAddress: string,
  abi: string,
  functionName: string,
  params: any[],
  signer: ethers.Signer
): Promise<ethers.providers.TransactionResponse> {
  const contractABI = JSON.parse(abi);
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  const tx = await contract[functionName](...params);
  return tx;
}

// 格式化地址显示
export function formatAddress(address: string, length: number = 10): string {
  if (address.length <= length * 2) return address;
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

// 格式化ETH金额
export function formatETH(amount: string, decimals: number = 6): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

// 获取网络信息
export function getNetworkInfo(chainId: number): Network | undefined {
  return SUPPORTED_NETWORKS.find(network => network.chainId === chainId);
}

// 切换网络
export async function switchNetwork(chainId: number): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask未安装');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    return true;
  } catch (error: any) {
     if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
      // 网络不存在，尝试添加
      const network = getNetworkInfo(chainId);
      if (network) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl]
            }]
          });
          return true;
        } catch (addError) {
          console.error('添加网络失败:', addError);
          return false;
        }
      }
    }
    console.error('切换网络失败:', error);
    return false;
  }
}

// 连接钱包
export async function connectWallet(): Promise<string[]> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask未安装');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts;
  } catch (error) {
    console.error('连接钱包失败:', error);
    throw error;
  }
}

// 获取当前网络
export async function getCurrentNetwork(): Promise<number> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask未安装');
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('获取网络失败:', error);
    throw error;
  }
} 
