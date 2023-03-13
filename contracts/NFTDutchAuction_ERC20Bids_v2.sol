// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import './NFTDutchAuction_ERC20Bids.sol';

contract NFTDutchAuction_ERC20Bids_v2 is NFTDutchAuction_ERC20Bids {

    function getNft() public view returns (address, uint256) {
        return (address(erc721TokenAddress), nftTokenId);
    }

    function getReservePrice() public view returns (uint256) {
        return reservePrice;
    }

    function reInitialize() public reinitializer(2) {
        // do nothing
    }
}