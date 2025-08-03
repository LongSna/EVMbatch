'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { Address, Transaction } from '../types';
import { generateBytecodeWithAddresses, getBytecodeSize } from '../utils/bincode';

// 合约操作组件
export function ContractOperationPanel({
  contractAddress,
  setContractAddress,
  contractABI,
  setContractABI,
  addresses,
  setTransactions,
  isConnected
}: {
  contractAddress: string;
  setContractAddress: (address: string) => void;
  contractABI: string;
  setContractABI: (abi: string) => void;
  addresses: Address[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  isConnected: boolean;
}) {
  const [contractSource, setContractSource] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [functionParams, setFunctionParams] = useState('');
  const [generatedBytecode, setGeneratedBytecode] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [receiveTo, setReceiveTo] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');

  const selectedAddresses = addresses.filter(addr => addr.isSelected);

  const generateBytecode = () => {
    if (selectedAddresses.length === 0) {
      alert('请选择要操作的地址');
      return;
    }

    try {
      const bytecode = generateBytecodeWithAddresses(selectedAddresses,tokenAddress);
      setGeneratedBytecode(bytecode);
      
      // 计算字节码大小
      const size = getBytecodeSize(bytecode);
      console.log(`生成的字节码大小: ${size} 字节`);
      
    } catch (error) {
      console.error('生成字节码失败:', error);
      alert(`生成字节码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const deployContract = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (selectedAddresses.length === 0) {
      alert('请选择要操作的地址');
      return;
    }

    if (!generatedBytecode) {
      alert('请先生成字节码');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 使用Web3 Wallet的地址进行部署
      const deployerAddress = await signer.getAddress();
      
      // 估算gas限制
      const estimatedGas = await provider.estimateGas({
        data: generatedBytecode
      });
      
      // 创建交易
      const tx = await signer.sendTransaction({
        data: generatedBytecode,
        gasLimit: estimatedGas.mul(120).div(100) // 增加20%的缓冲
      });

      const transaction: Transaction = {
        hash: tx.hash,
        from: deployerAddress,
        to: '', // 部署合约时to为空
        amount: '0',
        type: 'contract',
        status: 'pending',
        timestamp: new Date().toISOString(),
        data: generatedBytecode
      };

      setTransactions((prev: Transaction[]) => [...prev, transaction]);

      // 等待交易确认
      const receipt = await tx.wait();
      transaction.status = 'success';
      transaction.gasUsed = receipt.gasUsed.toString();
      
      // 更新合约地址
      setContractAddress(receipt.contractAddress || '');
      
      alert(`合约部署成功！合约地址: ${receipt.contractAddress}`);
      
    } catch (error) {
      console.error('部署合约失败:', error);
      alert('部署合约失败');
    }
  };

  const batchCallContract = async (functionType: 'transfer' | 'receive') => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (!contractAddress) {
      alert('请输入合约地址');
      return;
    }

    if (functionType === 'transfer' && (!transferFrom || !transferAmount)) {
      alert('请填写Transfer函数的From地址和金额');
      return;
    }

    if (functionType === 'receive' && (!receiveTo || !receiveAmount)) {
      alert('请填写Receive函数的To地址和金额');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newTransactions: Transaction[] = [];

      // 生成调用数据
      let callData = '';
      if (functionType === 'transfer') {
        // 验证地址格式
        if (!ethers.utils.isAddress(transferFrom)) {
          alert('From地址格式无效');
          return;
        }
        
        // Transfer函数: 0x52850170 + from(32字节) + amount(32字节)
        // 注意：from地址应该是调用者地址，但这里我们使用用户输入的地址
        const fromPadded = ethers.utils.hexZeroPad(transferFrom, 32);
        const amountValue = transferAmount === '' ? '0' : transferAmount;
        const amountPadded = ethers.utils.hexZeroPad(ethers.utils.hexlify(ethers.BigNumber.from(amountValue)), 32);
        callData = `0x52850170${fromPadded.slice(2)}${amountPadded.slice(2)}`;
        
        // 调试信息
        console.log('Transfer参数调试:');
        console.log('transferFrom:', transferFrom);
        console.log('transferAmount:', transferAmount);
        console.log('fromPadded:', fromPadded);
        console.log('amountPadded:', amountPadded);
        console.log('callData:', callData);
        console.log('callData长度:', callData.length);
      } else if (functionType === 'receive') {
        // 验证地址格式
        if (!ethers.utils.isAddress(receiveTo)) {
          alert('To地址格式无效');
          return;
        }
        
        // Receive函数: 0x165b478b + to(32字节) + amount(32字节)
        const toPadded = ethers.utils.hexZeroPad(receiveTo, 32);
        const amountValue = receiveAmount === '' ? '0' : receiveAmount;
        const amountPadded = ethers.utils.hexZeroPad(ethers.utils.hexlify(ethers.BigNumber.from(amountValue)), 32);
        callData = `0x165b478b${toPadded.slice(2)}${amountPadded.slice(2)}`;
        
        // 调试信息
        console.log('Receive参数调试:');
        console.log('receiveTo:', receiveTo);
        console.log('receiveAmount:', receiveAmount);
        console.log('toPadded:', toPadded);
        console.log('amountPadded:', amountPadded);
        console.log('callData:', callData);
        console.log('callData长度:', callData.length);
      }

      // 使用Web3钱包发送交易
      try {
        const signer = provider.getSigner();
        const deployerAddress = await signer.getAddress();
        
        // 估算gas限制
        const estimatedGas = await provider.estimateGas({
          to: contractAddress || ethers.constants.AddressZero,
          data: callData
        });
        
        // 创建交易
        const tx = await signer.sendTransaction({
          to: contractAddress || ethers.constants.AddressZero,
          data: callData,
          gasLimit: estimatedGas.mul(120).div(100) // 增加20%的缓冲
        });
        
        const transaction: Transaction = {
          hash: tx.hash,
          from: deployerAddress,
          to: contractAddress || '0x0000000000000000000000000000000000000000',
          amount: '0',
          type: 'contract',
          status: 'pending',
          timestamp: new Date().toISOString()
        };

        setTransactions((prev: Transaction[]) => [...prev, transaction]);
        
        // 等待交易确认
        const receipt = await tx.wait();
        transaction.status = 'success';
        transaction.gasUsed = receipt.gasUsed.toString();
        
        alert(`合约调用成功！交易哈希: ${tx.hash}`);
        
      } catch (error) {
        console.error('调用合约失败:', error);
        alert(`调用合约失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      setTransactions((prev: Transaction[]) => [...prev, ...newTransactions]);
      
    } catch (error) {
      console.error('批量调用合约失败:', error);
      alert('批量调用合约失败:'+error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">合约操作</h3>
      
      {/* 合约部署 */}
      <div className="border rounded p-4">
        <h4 className="font-semibold mb-2">部署合约</h4>
        <div className="space-y-2">
          {/* 已选择地址数量显示 */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                <span className="font-medium">已选择地址数量(加入address_package):</span>
                <span className="ml-2 text-lg font-bold">{selectedAddresses.length}</span>
              </div>
              <div className="text-xs text-blue-600">
                总地址数: {addresses.length}
              </div>
            </div>
            {selectedAddresses.length > 0 && (
              <div className="mt-2 text-xs text-blue-700">
                选择率: {((selectedAddresses.length / addresses.length) * 100).toFixed(1)}%
              </div>
            )}
          </div>
          {/* TokenAddress输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token地址
            </label>
            <input 
              type="text"
              placeholder="输入Token合约地址"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              用于指定要操作的代币合约地址
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={generateBytecode}
              disabled={!isConnected || selectedAddresses.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              生成字节码 ({selectedAddresses.length} 个地址)
            </button>
            <button 
              onClick={deployContract}
              disabled={!isConnected || selectedAddresses.length === 0 || !generatedBytecode}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              部署合约 ({selectedAddresses.length} 个地址)
            </button>
          </div>
          
          {/* 显示生成的字节码 */}
          {generatedBytecode && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h5 className="font-semibold mb-2">生成的字节码:</h5>
              <div className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
                {generatedBytecode}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                字节码大小: {getBytecodeSize(generatedBytecode)} 字节
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 合约调用 */}
      <div className="border rounded p-4">
        <h4 className="font-semibold mb-2">调用合约</h4>
        <div className="space-y-2">
          {/* 输入合约地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              合约地址
            </label>
            <input 
              type="text"
              placeholder="输入要调用的合约地址"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Transfer函数参数 */}
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-700 mb-3">Transfer函数 (0x52850170)</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">From地址</label>
                <input 
                  type="text"
                  placeholder="0x..."
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  From地址将从address_package中循环读取（需预授权）
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">金额</label>
                <input 
                  type="text"
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Receive函数参数 */}
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-700 mb-3">Receive函数 (0x165b478b)</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">To地址</label>
                <input 
                  type="text"
                  placeholder="0x..."
                  value={receiveTo}
                  onChange={(e) => setReceiveTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  To地址将从address_package中循环读取（需预授权）
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">金额</label>
                <input 
                  type="text"
                  placeholder="0"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => batchCallContract('transfer')}
              disabled={!isConnected || !contractAddress || !transferFrom || !transferAmount}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              调用Transfer
            </button>
            <button 
              onClick={() => batchCallContract('receive')}
              disabled={!isConnected || !contractAddress || !receiveTo || !receiveAmount}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              调用Receive
            </button>
          </div>
          
          {/* 调试信息 */}
          <div className="text-sm text-gray-600 space-y-1">
            <div>钱包连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</div>
            <div>已选择地址数量: {selectedAddresses.length}</div>
            <div>合约地址: {contractAddress || '未设置 (将使用零地址)'}</div>
            {!isConnected && (
              <div className="text-red-600">⚠️ 请先点击右上角的"连接钱包"按钮</div>
            )}
            {isConnected && selectedAddresses.length === 0 && (
              <div className="text-red-600">⚠️ 请在左侧地址管理中选择要操作的地址</div>
            )}
            {generatedBytecode && (
              <div className="text-green-600">
                ✅ 字节码已生成 ({getBytecodeSize(generatedBytecode)} 字节)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 