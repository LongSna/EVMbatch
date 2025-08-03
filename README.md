# EVMbatch - 批量EVM操控工具

一个基于Next.js和Ethers.js的Web3工具，用于批量操作以太坊地址和智能合约。

## 功能特性

### 🔧 直接EVM操作
- 批量生成以太坊地址
- 导入/导出地址列表
- 批量发送交易
- 支持自定义Gas设置

### 📋 智能合约操作
- 动态合约部署
- 批量合约调用
- 自动Gas估算
- 支持Transfer和Receive函数

### 🚀 EIP-7702 账户抽象
- 智能合约钱包支持
- 批量交易处理
- Gas费用优化
- 交易签名验证

## 快速开始

### 环境要求
- Node.js 18+
- 现代浏览器（支持Web3）
- MetaMask或其他Web3钱包

### 安装依赖
```bash
cd evmbatch
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 访问应用
打开浏览器访问 `http://localhost:3000`

## 使用指南

### 1. 连接钱包
- 点击"连接钱包"按钮
- 授权MetaMask连接
- 确保钱包已连接到正确的网络

### 2. 地址管理
- **生成地址**：点击"生成地址"创建新的以太坊地址
- **导入地址**：从JSON文件进行批量导入
- **导出地址**：下载当前地址列表为JSON文件
- **选择地址**：勾选需要操作的地址
- **全选/取消全选**：快速选择或取消所有地址

### 3. 直接EVM操作
- 选择操作类型：发送ETH或调用合约
- 输入目标地址和金额
- 设置Gas价格和Gas限制
- 点击"发送交易"执行批量操作

### 4. 智能合约操作

#### 部署合约
- 输入Token合约地址
- 选择要包含在address_package中的地址
- 点击"生成字节码"和"部署合约"
- 查看已选择地址数量和部署状态

#### 调用合约
- 输入已部署的合约地址
- **Transfer函数**：输入From地址和金额
- **Receive函数**：输入To地址和金额
- 系统自动从address_package循环读取对应地址
- 点击"调用合约"执行操作

### 5. EIP-7702功能
- 查看账户抽象功能说明
- 支持智能合约钱包创建
- 批量交易处理
- Gas费用优化

## 技术架构

### 前端技术栈
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Ethers.js** - Web3库

### 核心组件
- `AddressManager` - 地址管理
- `DirectOperationPanel` - 直接EVM操作
- `ContractOperationPanel` - 智能合约操作
- `EIP7702OperationPanel` - EIP-7702功能

### 智能合约
- **Yul语言**编写的合约
- 支持批量Transfer和Receive操作
- 动态address_package管理
- 自动Gas估算

## 安全注意事项

⚠️ **重要提醒**
- 私钥信息仅存储在浏览器本地
- 请勿在不安全的环境中使用
- 建议使用测试网络进行测试
- 生产环境请谨慎操作

## 开发状态

- ✅ 直接EVM操作 - 已完成
- ✅ 智能合约操作 - 已完成
- 🚧 EIP-7702功能 - 开发中

## 许可证

MIT License

## 贡献
合约部分参照 https://github.com/CryptoNyaRu/DownTop
欢迎提交Issue和Pull Request来改进这个项目。
