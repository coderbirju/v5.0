// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract HuskyCoin is ERC20, Ownable, ERC20Permit {
    uint256 amount;

    constructor(uint256 _amount) ERC20('HuskyCoin', 'HUSKY') ERC20Permit('HuskyCoin') {
        amount = _amount;
        _mint(msg.sender, amount * 10 ** decimals());
    }

    function mint(address to, uint256 _amount) public onlyOwner {
        _mint(to, _amount);
    }
}