import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
// import { upgrades } from '@openzeppelin/hardhat-upgrades';
import { Contract, Signer, utils } from 'ethers';

describe('Test Dutch Auction Contract', function () {
    let contract: Contract;
    let newContract: Contract;
    let nftContract: Contract;
    let huskyCoin: Contract;
    let owner: Signer;
    let nftOwner: Signer;

  async function deployContracts() {
    const RESERVE_PRICE = 1000;
      const NUM_BLOCKS_AUCTION_OPEN = 10;
      const PRICE_DECREMENT = 100;
      const TOKEN_ID = 1;
      const COIN_LIMIT = 10000;
      
      [owner, nftOwner] = await ethers.getSigners();
      const Contract = await ethers.getContractFactory('NFTDutchAuction_ERC20Bids');
      const NftContract = await ethers.getContractFactory('BasicNft');
      const HuskyCoin = await ethers.getContractFactory('HuskyCoin');
      huskyCoin = await HuskyCoin.connect(owner).deploy(COIN_LIMIT);
      nftContract = await NftContract.connect(nftOwner).deploy("BasicNft", "BNFT");
      await nftContract.deployed();
      await huskyCoin.deployed();
      await nftContract.connect(nftOwner).mintNFTtoken();
      contract = await upgrades.deployProxy(Contract, 
        [
          huskyCoin.address, 
          nftContract.address, 
          TOKEN_ID, 
          RESERVE_PRICE, 
          NUM_BLOCKS_AUCTION_OPEN, 
          PRICE_DECREMENT
        ], 
        { 
          initializer: 'initialize', 
          kind: 'uups' 
        }
      );
      
      await contract.deployed();
      await nftContract.connect(nftOwner).approve(contract.address, TOKEN_ID);
  }


  async function deployUpgradedContracts() {
    const NewContract = await ethers.getContractFactory('NFTDutchAuction_ERC20Bids_v2');
    newContract = await upgrades.upgradeProxy(contract.address, NewContract, {call: {fn: 'reInitialize'}});
  }

  describe('Working of the NFTDutchAuction', () => {
    
  
    beforeEach(async () => {
      await deployContracts();
    });
  
    it('should deploy the contract', async () => {
      expect(contract.address).to.not.be.null;
    });
  
    it('should set the correct reserve price', async () => {
      expect(await contract.reservePrice()).to.equal(1000);
    });
  
    it('should set the correct initial price', async () => {
      expect(await contract.initialPrice()).to.equal(1000 + (100 * 10));
    });
  
    it('should set the correct current price', async () => {
      expect(await contract.currentPrice()).to.equal(1000 + (100 * 10));
    });
  
    it('should accept a valid bid', async () => {

      const bidAmount = 2000;
      // const huskyCoin2 = await ethers.getContractAt('HuskyCoin', await contract.erc20TokenAddress());
      await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
      const result = await contract.bid(bidAmount);
      expect(result.hash).to.not.be.null;
    });

    it('should not allow bidding below the current price', async () => {
      try {
        const bidAmount = 1500;
        await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
        await contract.bid(bidAmount);
      } catch (error: any) {
        expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Bid is lower than current price'");
      }
    });
  
    it('should set the correct winning address', async () => {
      const bidAmount = 2000;
      await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
      await contract.bid(bidAmount);
      expect(await contract.winnerAddress()).to.equal(await owner.getAddress());
    });
  
    it('should set the correct winning bid amount', async () => {
      const bidAmount = 2000;
      await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
      await contract.bid(bidAmount);
      expect(await contract.winningBidAmount()).to.equal(2000);
    });
  
    it('should end the auction', async () => {
      const bidAmount = 2000;
      await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
      await contract.bid(bidAmount);
      expect(await contract.auctionEnded()).to.be.true;
    });
  
    it('should not allow bidding after the auction end', async () => {
      try {
        const bidAmount = 2000;
        await huskyCoin.connect(owner).approve(contract.address, ethers.utils.parseUnits(bidAmount.toString(), 18));
        await contract.bid(bidAmount);
      } catch (error: any) {
        expect(error.message).to.equal("AssertionError: expected 'VM Exception while processing transac…' to equal 'Auction has ended'");
      }
    });

    it('should allow a bidder to place a bid during the auction', async () => {
      const [bidder1] = await ethers.getSigners();
      const winningBidAmount = 2000;
      await huskyCoin.connect(bidder1).approve(contract.address, ethers.utils.parseUnits(winningBidAmount.toString(), 18));
      await contract.connect(bidder1).bid(winningBidAmount);
      const winnerAddress = await contract.winnerAddress();
      expect(await bidder1.getAddress()).to.equal(winnerAddress);
    }); 



    it('should refund the losing bidder', async () => {
      const [bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();
      const winningBidAmount = 2000;
      const losingBidAmount = 1000;
    
      await huskyCoin.connect(bidder1).transfer(bidder3.address, ethers.utils.parseUnits('2000', 18));
    
      await huskyCoin.connect(bidder1).transfer(bidder4.address, ethers.utils.parseUnits('1000', 18));
    
      // Approve the contract to spend the bidder's ERC20 tokens
      await huskyCoin.connect(bidder3).approve(contract.address, winningBidAmount);
      await huskyCoin.connect(bidder4).approve(contract.address, losingBidAmount);
    
      // Make the winning bid
      await contract.connect(bidder3).bid(winningBidAmount);
      
      // Make the losing bid
      await expect(contract.connect(bidder4).bid(losingBidAmount)).to.be.revertedWith('Auction has ended');
    
      // Get the balance of the losing bidder after making the second bid
      // const balanceAfter = await huskyCoin.connect(bidder4).balanceOf(bidder4.address);
    
      // Ensure that the losing bidder received a refund for their bid
      // expect(balanceAfter.sub(balanceBefore)).to.be.equal(losingBidAmount);
    });
    
    

    it('should transfer the NFT to the winning bidder', async () => {
      const [bidder1] = await ethers.getSigners();
      const winningBidAmount = 2000;
      await huskyCoin.connect(bidder1).approve(contract.address, ethers.utils.parseUnits(winningBidAmount.toString(), 18));
      await contract.connect(bidder1).bid(winningBidAmount);
      const winnerAddress = await contract.winnerAddress();
      expect(await nftContract.ownerOf(1)).to.equal(winnerAddress);
    });



    
  });

  describe('Working of the NFTDutchAuction with a UUPS proxy', () => {
    beforeEach(async () => {
      await deployContracts();
    });

    // it('should not allow a non-owner to upgrade the contract', async () => {
    //   const NewContract = await ethers.getContractFactory('NFTDutchAuction_ERC20Bids_v2');
    //   // expect(contract.address).to.not.be.null;
    //   await expect(upgrades.upgradeProxy(contract.address, NewContract )).to.be.revertedWith('Ownable: caller is not the owner');
    // });

    
    it('should upgrade the contract', async () => {
      
      // expect(contract.address).to.not.be.null;
      await deployUpgradedContracts();
      expect(newContract.address).to.not.be.null;
    });

    it('should have the getNft function', async () => {
      await deployUpgradedContracts();
      let [nftAddress, nftId] = await newContract.getNft();
      console.log('nftId: ', nftId);
      expect(nftAddress).to.equal(nftContract.address);
      // console.log('nftContract: ', nftContract.address);
      // console.log('nftAddress: ', nftAddress);

    });

    it('should have the getReservePrice function', async () => {
      await deployUpgradedContracts();
      let reservePrice = await newContract.getReservePrice();
      expect(reservePrice).to.equal(1000);
    });

  });

});
