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
        const tx2 = await AlethenaSharesInstance.mint(ALEQSupplyAddress,ALEQAmountToMint,"Test");
        // assert.equal(ALEQAmountToMint, await AlethenaSharesInstance.balanceOf(ALEQSupplyAddress));
        //console.log(tx2.logs[0].args); 
    });

    // it('Allow Share Dispenser to use ALEQ reserve', async () =>{
        // const tx1 = await AlethenaSharesInstance.approve(ShareDispenserInstance.address, ALEQAmountToMint, {from: ALEQSupplyAddress});
    //     temp = await AlethenaSharesInstance.allowance(ALEQSupplyAddress, ShareDispenserInstance.address);
    //     assert.equal(ALEQAmountToMint, await AlethenaSharesInstance.allowance(ALEQSupplyAddress, ShareDispenserInstance.address)); 
    // });


    it('Mint CXHF tokens', async () =>{
        let mintAmount1 = new BN(60);
        let multiplier = new BN(10);
        let decimals = new BN(18);

        let mintBN = multiplier.pow(decimals).mul(mintAmount1);

        console.log(mintBN.toString(10));
    
        // const tx = await XCHFInstance.mint(Buyer, mintAmount1.mul(10));

        // console.log(await XCHFInstance.balanceOf(Buyer));
        // console.log(tx);

        // assert.equal(mintAmount1, new BN(await XCHFInstance.balanceOf(Buyer)));

        // await XCHFInstance.mint(conflictingBuyer1,30000*10**18);
        // assert.equal(30000*10**18, await XCHFInstance.balanceOf(conflictingBuyer1));

        // await XCHFInstance.mint(conflictingBuyer2,40000*10**18);
        // assert.equal(40000*10**18, await XCHFInstance.balanceOf(conflictingBuyer2));  
    });

    // it('Set supply and pay-in addresses', async () =>{
    //     const tx1 = await ShareDispenserInstance.setXCHFPayInAddress(XCHFPayInAddress);
    //     const tx2 = await ShareDispenserInstance.setALEQSupplyAddress(ALEQSupplyAddress);
    //     assert.equal(tx1.logs[0].event, 'XCHFPayInAddressSet');
    //     assert.equal(tx1.logs[0].args.newXCHFPayInAddress, XCHFPayInAddress);
    //     assert.equal(tx2.logs[0].event, 'ALEQSupplyAddressSet');
    //     assert.equal(tx2.logs[0].args.newALEQSupplyAddress, ALEQSupplyAddress);
    // })

    // it('Set allowance', async () =>{
    //     await XCHFInstance.approve(ShareDispenserInstance.address, 50*10**18, {from: Buyer});
    //     await XCHFInstance.approve(ShareDispenserInstance.address, 25000*10**18, {from: conflictingBuyer1});
    //     await XCHFInstance.approve(ShareDispenserInstance.address, 25000*10**18, {from: conflictingBuyer2});
    // })

    // it('Buy shares', async () =>{
    //     var tx = await ShareDispenserInstance.buyShares(10,{from: Buyer});
    //     assert.equal(10, await AlethenaSharesInstance.balanceOf(Buyer));
    //     assert.equal(tx.logs[0].event, 'sharesPurchased');
    //     assert.equal(tx.logs[0].args.buyer, Buyer);
    //     assert.equal(tx.logs[0].args.amount, 10); 
    // });

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