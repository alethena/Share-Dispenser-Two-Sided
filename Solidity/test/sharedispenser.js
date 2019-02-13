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

        const temp = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);
        console.log(temp.toString(10));

        var tx = await ShareDispenserInstance.buyShares(numberOfSharesToBuy,{from: Buyer});
        // assert.equal(5, await AlethenaSharesInstance.balanceOf(Buyer));
        console.log("Log:", tx.logs[0].args);
        const post1 = await AlethenaSharesInstance.balanceOf(Buyer);
        console.log("Buyer ALEQ balance:", post1.toString(10));
        const post2 = await XCHFInstance.balanceOf(ShareDispenserInstance.address);
        console.log("SD XCH balance:", post2.toString(10));
    });

    it('Set allowance', async () =>{
        const numberOfSharesToSell = new BN(234);        
        await AlethenaSharesInstance.approve(ShareDispenserInstance.address, numberOfSharesToSell, {from: Buyer});
    })

    it('Sell shares', async () =>{
        const numberOfSharesToSell = new BN(234);
        const supply = await ShareDispenserInstance.getERC20Available(AlethenaSharesInstance.address, ShareDispenserInstance.address);
        const buybackPrice = ShareDispenserInstance.getCumulatedBuyBackPrice(numberOfSharesToSell, supply);

        // const temp = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);
        // console.log(temp.toString(10));

        var tx = await ShareDispenserInstance.sellShares(numberOfSharesToSell,{from: Buyer});
        // assert.equal(5, await AlethenaSharesInstance.balanceOf(Buyer));
        console.log("Log:", tx.logs[0].args);
        const post1 = await AlethenaSharesInstance.balanceOf(Buyer);
        console.log("Buyer ALEQ balance:", post1.toString(10));

        const post3 = await XCHFInstance.balanceOf(Buyer);
        console.log("Buyer XCHF balance:", post3.toString(10));

        const post2 = await XCHFInstance.balanceOf(ShareDispenserInstance.address);
        console.log("SD XCH balance:", post2.toString(10));
    });

    // Unit tests for pricing function

    // //NEXT: COLLISION TESTS. I.e. what if an order doesn't go through for some reason?
    // it('Buy shares but too low supply', async () =>{
    //     try{
    //         const tx1 = await ShareDispenserInstance.buyShares(5000,{from: conflictingBuyer1}); //.then((tx)=>{console.log(tx)});
    //     }
    //     catch(err){
    //         console.log(err);
    //     }
    //     await helpers.shouldRevert(ShareDispenserInstance.buyShares(5000,{from: conflictingBuyer2})); //.then((tx)=>{console.log(tx)});
    // });
});