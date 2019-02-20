//import expectThrow from './tools';

const BN = require('bn.js');
const AlethenaShares = artifacts.require('../contracts/ALEQ/AlethenaShares.sol');
const CryptoFranc = artifacts.require('../contracts/XCHF/CryptoFranc.sol');
const ShareDispenser = artifacts.require('../contracts/ShareDispenser.sol');
// const helpers = require('../../utilities/helpers.js');

//const helpers = require('../utilities/helpers.js');
//var Accounts  = require('../node_modules/web3-eth-accounts');
//var web3utils = require('web3-utils');

contract('ShareDispenser', (accounts)=>{

    //Accounts used

    const Owner             = accounts[0];
    const XCHFPayInAddress  = accounts[1];
    const Buyer             = accounts[2];
    const Seller            = accounts[3];
    const conflictingBuyer1 = accounts[4];
    const conflictingBuyer2 = accounts[5];
    const treasury          = accounts[6];

    const ALEQAmountToMint = 127043;
    //const XCHFAmountToMint = 10**6*10**18;


    let AlethenaSharesInstance;
    let ShareDispenserInstance;
    let XCHFInstance;

    before(async () => {
        AlethenaSharesInstance = await AlethenaShares.deployed();
        XCHFInstance = await CryptoFranc.deployed();
        ShareDispenserInstance = await ShareDispenser.deployed();
        console.log("AlethenaSharesInstance", AlethenaSharesInstance.address);
        console.log("XCHFInstance", XCHFInstance.address);
        console.log("ShareDispenserInstance", ShareDispenserInstance.address);

    });

    it('Mint ALEQ tokens', async () =>{
        const tx1 = await AlethenaSharesInstance.setTotalShares(ALEQAmountToMint);
        const tx2 = await AlethenaSharesInstance.mint(ShareDispenserInstance.address, 10000, "Test");
        const tx3 = await AlethenaSharesInstance.mint(treasury, ALEQAmountToMint-10000, "Test");
    });

    it('Mint CXHF tokens', async () =>{
        let mintAmount1 = new BN(1000000);
        let multiplier = new BN(10);
        let decimals = new BN(18);

        let mintBN = multiplier.pow(decimals).mul(mintAmount1);
    
        const tx = await XCHFInstance.mint(Buyer, mintBN);
    });

    // it('Check price', async () =>{
    //     let price = await ShareDispenserInstance.getCumulatedPrice(2000, 11000);
    //     console.log("Price", price.toString());
    //     let price2 = await ShareDispenserInstance.getCumulatedBuyBackPrice(2000, 9000);
    //     console.log("Price", price2.toString());
    // })

    it('Set allowance', async () =>{
        const numberOfSharesToBuy = new BN(234);
        const supply = await ShareDispenserInstance.getERC20Balance(AlethenaSharesInstance.address);
        console.log("Supply:", supply.toString(10));
        const totalPrice = await ShareDispenserInstance.getCumulatedPrice(numberOfSharesToBuy, supply);
        console.log("Total Price:", totalPrice.toString(10));
        await XCHFInstance.approve(ShareDispenserInstance.address, totalPrice, {from: Buyer});
    })

    it('Buy shares', async () =>{
        const numberOfSharesToBuy = new BN(234);
        const supply = await ShareDispenserInstance.getERC20Available(AlethenaSharesInstance.address, ShareDispenserInstance.address);
        const totalPrice = ShareDispenserInstance.getCumulatedPrice(numberOfSharesToBuy, supply);

        const XCHFBalancePreBuyer = await XCHFInstance.balanceOf(Buyer);
        const XCHFBalancePreSD = await XCHFInstance.balanceOf(ShareDispenserInstance.address);
        const ALEQBalancePreBuyer = await AlethenaSharesInstance.balanceOf(Buyer);
        const ALEQBalancePreSD = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);

        var tx = await ShareDispenserInstance.buyShares(numberOfSharesToBuy,{from: Buyer});

        const XCHFBalancePostBuyer = await XCHFInstance.balanceOf(Buyer);
        const XCHFBalancePostSD = await XCHFInstance.balanceOf(ShareDispenserInstance.address);
        const ALEQBalancePostBuyer = await AlethenaSharesInstance.balanceOf(Buyer);
        const ALEQBalancePostSD = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);

        // Check effects
        assert.equal(XCHFBalancePreBuyer.sub(totalPrice), XCHFBalancePostBuyer);
        // Check events


    });

    it('Set allowance', async () =>{
        const numberOfSharesToSell = new BN(234);        
        await AlethenaSharesInstance.approve(ShareDispenserInstance.address, numberOfSharesToSell, {from: Buyer});
    })

    it('Sell shares', async () =>{
        const numberOfSharesToSell = new BN(234);
        const supply = await ShareDispenserInstance.getERC20Balance(AlethenaSharesInstance.address);
        const buybackPrice = await ShareDispenserInstance.getCumulatedBuyBackPrice(numberOfSharesToSell, supply);

        // const temp = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);
        // console.log(temp.toString(10));

        var tx = await ShareDispenserInstance.sellShares(numberOfSharesToSell, buybackPrice, {from: Buyer});
        // assert.equal(5, await AlethenaSharesInstance.balanceOf(Buyer));
        console.log("Log:", tx.logs[0].args);
        const post1 = await AlethenaSharesInstance.balanceOf(Buyer);
        console.log("Buyer ALEQ balance:", post1.toString(10));

        const post3 = await XCHFInstance.balanceOf(Buyer);
        console.log("Buyer XCHF balance:", post3.toString(10));

        const post2 = await XCHFInstance.balanceOf(ShareDispenserInstance.address);
        console.log("SD XCH balance:", post2.toString(10));
    });

    // Test all the setters and getters

    // Negative test for all setters

    // Unit tests for pricing function

    // Test across kink

    // NEGATIVE TESTS:

    // Balance too low

    // Allowance not set

    // Sell. Someone buys first --> Should revert fully

    // 

  
});