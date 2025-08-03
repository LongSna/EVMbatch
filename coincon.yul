object "coincon" {
    code {
        // 1. 复制运行码
        let runSize := datasize("coincon_runtime")
        datacopy(0, dataoffset("coincon_runtime"), runSize)

        // 2. 在内存 runSize 位置写入常量
        mstore(runSize, shl(96, caller()))       

        // 3. 返回"运行码 + 常量"总长度
        return(0, add(runSize, 20))
    }
    object "coincon_runtime" {
        code {
            // Defines
            function _upTop() -> _ { _ := 0x55d398326f99059ff775485246999027b3197955 }
    
            // Reverts
            function _revertEntrancePermissionDenied() {
                mstore(0, shl(248, 1))
                revert(0, 1)
            }
            function _revertTransferFailed() {
                mstore(0, shl(248, 2))
                revert(0, 1)
            }
            
            //GetDeployerAddr
            let deployerPos := sub(codesize(), 20)
            codecopy(0, deployerPos, 20)
            let deployer := shr(96, mload(0))
            
            //PermissionChecker
            if sub(caller(), deployer) {
                _revertEntrancePermissionDenied()
            }
    
            switch shr(224, calldataload(0))
    
            case 0x52850170 //transfer
            {
                // 检查 calldata 长度是否足够: 4 + 32 + 32 = 68 字节
                if lt(calldatasize(), 68) {
                    revert(0, 0)
                }
                
                // 读取 calldata 参数
                // 字节 4-35: from address (32 字节)
                let from := calldataload(4)
                // 字节 36-67: amount uint64 (32 字节，但只有低 8 字节有效)
                let amount := calldataload(36)
                
                // 验证 from 地址格式（确保高 12 字节为 0）
                //if gt(from, 0xffffffffffffffffffffffffffffffffffffffff) {
                 //   revert(0, 0)
                //}
                
                // 验证 amount 是否在 uint64 范围内
                //if gt(amount, 0xffffffffffffffff) {
                 // revert(0, 0)
                //}
                
                let holdersToProcess := div(datasize("address_package"), 20)
                mstore(0, shl(224, 0x23b872dd)) // transferFrom(address,address,uint256)
                mstore(4, from) //from (使用 calldata 中的 from 地址)
                mstore(36, 0) //to (将在循环中被覆盖)
                mstore(68, amount) // amount (使用 calldata 中的 amount)
    
                let holdersPos := dataoffset("address_package")
                 for { let i } lt(i, holdersToProcess) { i := add(i, 1) }{

                    datacopy(48, holdersPos, 20) //to
                    holdersPos := add(holdersPos, 20)
        
                    if iszero(call(gas(), _upTop(), 0, 0, 100, 0, 0)) {
                        _revertTransferFailed()
                    }
                }
                
            }
            case 0x165b478b //receive
            {
                // 检查 calldata 长度是否足够: 4 + 32 + 32 = 68 字节
                //if lt(calldatasize(), 68) {
                //    revert(0, 0)
                //}
                
                // 读取 calldata 参数
                // 字节 4-35: to address (32 字节)
                let to := calldataload(4)
                // 字节 36-67: amount uint256 (32 字节)
                let amount := calldataload(36)
                
                // 验证 to 地址格式（确保高 12 字节为 0）
                //if gt(to, 0xffffffffffffffffffffffffffffffffffffffff) {
                //    revert(0, 0)
                //}
                
                // 验证 amount 不为零
                //if iszero(amount) {
                //    revert(0, 0)
                //}
                
                let holdersToProcess := div(datasize("address_package"), 20)
                mstore(0, shl(224, 0x23b872dd)) // transferFrom(address,address,uint256)
                mstore(4, 0) //from （循环覆盖）
                mstore(36, to) //to 
                mstore(68, amount) // amount (使用 calldata 中的 amount)
    
                let holdersPos := dataoffset("address_package")
                for { let i } lt(i, holdersToProcess) { i := add(i, 1) } {
                    datacopy(16, holdersPos, 20) //from
                    holdersPos := add(holdersPos, 20)
                    if iszero(call(gas(), _upTop(), 0, 0, 100, 0, 0)) {
                        _revertTransferFailed()
                    }
                }
            }
            
    
        }
        data "address_package" hex""
    }
}

