// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HuskyCoin is ERC20 {
    uint256 amount;

    constructor(uint256 _amount) ERC20('HuskyCoin', 'HUSKY') {
        amount = _amount;
        _mint(msg.sender, amount * 10 ** decimals());
    }
}