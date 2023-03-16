// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import 'hardhat/console.sol';

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

    function bidWithPermit(uint256 tokenAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public returns (address) {
        require(!auctionEnded, "Auction has ended");
        require(block.number < auctionEndBlock, "Auction has ended");
        updatePrice();
        require(tokenAmount >= currentPrice, "Bid is lower than current price");
        require(winnerAddress == address(0), "Auction has already been won");
        erc20TokenAddress.permit(msg.sender, address(this), tokenAmount, deadline, v, r, s);
        require(
            erc20TokenAddress.allowance(msg.sender, address(this)) >=
                tokenAmount,
            "Insufficient allowance"
        );
        require(
            erc20TokenAddress.transferFrom(
                msg.sender,
                addressOfOwner,
                tokenAmount
            ),
            "Transfer failed"
        );
        auctionEnded = true;
        winnerAddress = payable(msg.sender);
        erc721TokenAddress.transferFrom(
            addressOfOwner,
            winnerAddress,
            nftTokenId
        );
        winningBidAmount = tokenAmount;
        return winnerAddress;
    }
    
}