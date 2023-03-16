// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import 'hardhat/console.sol';
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol" ;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";


contract NFTDutchAuction_ERC20Bids is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    IERC721 public erc721TokenAddress;
    ERC20Permit public erc20TokenAddress;
    uint256 public nftTokenId;
    address payable public addressOfOwner;
    address payable public winnerAddress;
    uint256 public auctionEndBlock;
    uint256 public reservePrice;
    uint256 public numBlocksActionOpen;
    uint256 offerPriceDecrement;
    uint startBlockNumber;
    uint public winningBidAmount;
    bool public auctionEnded;
    bool confirmed;
    uint public initialPrice;
    uint public currentPrice;

    function initialize(
        address _erc20TokenAddress,
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) public initializer {
        erc20TokenAddress = ERC20Permit(_erc20TokenAddress);
        erc721TokenAddress = IERC721(_erc721TokenAddress);
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksActionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        addressOfOwner = payable(erc721TokenAddress.ownerOf(_nftTokenId));
        startBlockNumber = block.number;
        auctionEndBlock = block.number + numBlocksActionOpen;
        initialPrice =
            _reservePrice +
            (_offerPriceDecrement * _numBlocksAuctionOpen);
        currentPrice = initialPrice;
        auctionEnded = false;
        __Ownable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function bid(uint256 tokenAmount) public returns (address) {
        require(!auctionEnded, "Auction has ended");
        require(block.number < auctionEndBlock, "Auction has ended");
        updatePrice();
        require(tokenAmount >= currentPrice, "Bid is lower than current price");
        require(winnerAddress == address(0), "Auction has already been won");
        require(
            erc20TokenAddress.allowance(msg.sender, address(this)) >=
                tokenAmount,
            "Insufficient allowance"
        );
        // console.log('erc20TokenAddress.allowance(msg.sender, address(this)): ', erc20TokenAddress.allowance(msg.sender, address(this)));
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

    function updatePrice() internal {
        currentPrice =
            initialPrice -
            (offerPriceDecrement * (block.number - startBlockNumber));
    }

}
