"use client";
import { Address } from '../types';

/**
 * 生成包含地址列表的字节码
 * @param addresses 地址数组
 * @returns 生成的字节码字符串
 */
export function generateBytecodeWithAddresses(addresses: Address[], tokenAddress: string): string {
  // 验证地址格式
  const validAddresses = addresses.filter(addr => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr.address);
  });

  if (validAddresses.length === 0) {
    throw new Error('至少需要一个有效的地址');
  }

  // 构建地址包数据
  const addressPackage = validAddresses
    .map(addr => addr.address.toLowerCase().slice(2)) // 移除0x前缀并转为小写
    .join('');

  // 添加终止标记
  //const terminationMarker = '0000000000000000000000000000000000114514';
  
  // 构建完整的数据段
  const dataSegment = addressPackage ;

  // 计算数据段大小（字节数）
  const dataSize = dataSegment.length / 2;
  const dataSizeHex = dataSize.toString(16).padStart(4, '0');
  const _tokenAddress = tokenAddress.toLowerCase().slice(2);

  // 构建运行时代码模板
  const runtimeCode = `60148038035f395f5160601c330361011e575f3560e01c806352850170146100915763165b478b1461002e575b005b600435602435601461${dataSizeHex}04916323b872dd60e01b5f525f6004526024526044526101545f905b8282106100645750505061002c565b806014809260103901905f806064818061007c610123565b5af11561008c5760010190610055565b610147565b506044361061011a57600435602435906323b872dd60e01b5f526004525f6024526044526101545f905b66ffffffffffffff82106100d1575b505061002c565b806014809260303901906211451460305160601c14610115575f80606481806100f8610123565b5af1156101105766ffffffffffffff909190506100bb565b610147565b6100ca565b5f80fd5b61013b565b73${_tokenAddress}90565b600160f81b5f5260015ffd5b600260f81b5f5260015ffd`;

  // 计算运行时代码大小（包括数据段）
  const runtimeSize = (runtimeCode.length + dataSegment.length) / 2;
  const runtimeSizeHex = runtimeSize.toString(16).padStart(4, '0');
  
  // 构建构造函数
  const constructorCode = `601461${runtimeSizeHex}806100155f393360601b8152015ff3fe`;

  // 构建完整字节码
  const fullBytecode = `0x${constructorCode}${runtimeCode}fe${dataSegment}`;

  return fullBytecode;
}

/**
 * 验证地址格式
 * @param address 要验证的地址
 * @returns 是否为有效的以太坊地址
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 格式化地址数组
 * @param addresses 地址数组
 * @returns 格式化后的地址数组
 */
export function formatAddresses(addresses: string[]): string[] {
  return addresses
    .filter(addr => isValidAddress(addr))
    .map(addr => addr.toLowerCase());
}

/**
 * 计算字节码大小
 * @param bytecode 字节码字符串
 * @returns 字节码大小（字节数）
 */
export function getBytecodeSize(bytecode: string): number {
  // 移除0x前缀
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  return cleanBytecode.length / 2;
}
