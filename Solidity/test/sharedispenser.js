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
    const ALEQSupplyAddress = accounts[3];
    const conflictingBuyer1 = accounts[4];
    const conflictingBuyer2 = accounts[5];

    const ALEQAmountToMint = 10000;
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
        const tx2 = await AlethenaSharesInstance.mint(ShareDispenserInstance.address,ALEQAmountToMint,"Test");
        // assert.equal(ALEQAmountToMint, await AlethenaSharesInstance.balanceOf(ALEQSupplyAddress));
        //console.log(tx2.logs[0].args); 
    });

    // it('Allow Share Dispenser to use ALEQ reserve', async () =>{
        // const tx1 = await AlethenaSharesInstance.approve(ShareDispenserInstance.address, ALEQAmountToMint, {from: ALEQSupplyAddress});
    //     temp = await AlethenaSharesInstance.allowance(ALEQSupplyAddress, ShareDispenserInstance.address);
    //     assert.equal(ALEQAmountToMint, await AlethenaSharesInstance.allowance(ALEQSupplyAddress, ShareDispenserInstance.address)); 
    // });


    it('Mint CXHF tokens', async () =>{
        let mintAmount1 = new BN(6000);
        let multiplier = new BN(10);
        let decimals = new BN(18);

        let mintBN = multiplier.pow(decimals).mul(mintAmount1);
    
        const tx = await XCHFInstance.mint(Buyer, mintBN);
        mintIs = await XCHFInstance.balanceOf(Buyer);

        assert.equal(mintBN.toString(10), mintIs.toString(10));

    });

    // it('Check price', async () =>{
    //     let price = await ShareDispenserInstance.getCumulatedPrice(2000, 11000);
    //     console.log("Price", price.toString());
    //     let price2 = await ShareDispenserInstance.getCumulatedBuyBackPrice(2000, 9000);
    //     console.log("Price", price2.toString());
    // })

    it('Set allowance', async () =>{

        let mintAmount1 = new BN(6000);
        let multiplier = new BN(10);
        let decimals = new BN(18);
        
        let allowance = multiplier.pow(decimals).mul(mintAmount1);

        await XCHFInstance.approve(ShareDispenserInstance.address, allowance, {from: Buyer});
    })

    it('Buy shares', async () =>{
        const temp = await AlethenaSharesInstance.balanceOf(ShareDispenserInstance.address);
        console.log(temp.toString(10));
        var tx = await ShareDispenserInstance.buyShares(5,{from: Buyer});
        assert.equal(5, await AlethenaSharesInstance.balanceOf(Buyer));
        console.log(tx.logs[0].args);
        assert.equal(tx.logs[0].event, 'SharesPurchased');
        assert.equal(tx.logs[0].args.buyer, Buyer);
        assert.equal(tx.logs[0].args.amount, 5); 
    });

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