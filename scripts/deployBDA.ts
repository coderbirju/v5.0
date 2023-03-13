import { ethers,upgrades } from "hardhat";

async function main() {
    const RESERVE_PRICE = 1000;
    const BLOCKS_TO_AUCTION = 10;
    const PRICE_DECREASE = 100;
    // const TOKEN_ID = 1;
    const COIN_LIMIT = 10000;

    const BasicDutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids"); 
    const HuskyCoin = await ethers.getContractFactory('HuskyCoin');
    const NftContract = await ethers.getContractFactory("BasicNft");
    const huskyCoin = await HuskyCoin.deploy(COIN_LIMIT);
    const nftContract = await NftContract.deploy("BasicNft", "BNFT");
    await nftContract.deployed();
    await huskyCoin.deployed();
    const TOKEN_ID = await (await nftContract.totalSupply()).add(1);
    const basicDutchAuction = await upgrades.deployProxy(BasicDutchAuction,[huskyCoin.address, nftContract.address, TOKEN_ID, RESERVE_PRICE, BLOCKS_TO_AUCTION, PRICE_DECREASE],{initializer: 'initialize', kind: 'uups'});
    await basicDutchAuction.deployed();

    console.log(`NFTDutchAuction_ERC20Bids deployed to: ${basicDutchAuction.address} with reserve price: ${RESERVE_PRICE} and blocks to auction: ${BLOCKS_TO_AUCTION} and price decrease: ${PRICE_DECREASE}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});