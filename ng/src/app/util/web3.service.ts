import { Injectable } from '@angular/core';
import contract from 'truffle-contract';
import { MatSnackBar } from '@angular/material';
import { Big } from 'big.js';

import { Subject } from 'rxjs';
declare let require: any;
const Web3 = require('web3');


declare let window: any;

const contractAddresses = require('../../assets/contractAddresses.json');

const XCHF_artifacts = require('../../assets/contracts/CryptoFranc.json');
const XCHFAddress = contractAddresses.XCHFAddress;

const SD_artifacts = require('../../assets/contracts/ShareDispenser.json');
const SDAddress = contractAddresses.SDAddress;

const ALEQ_artifacts = require('../../assets/contracts/AlethenaShares.json');
const ALEQAddress = contractAddresses.ALEQAddress;

// SD Address: 0x0badd9a32d59978d99b65369bf7425a8db566035
// XCHF Address: 0x75385da3ae7e5a5f3dc118b6c9958eb77ecf538a
// ALEQ Address: 0x03b98a0c60135ebeec0ea8a3b476251a545e3270


@Injectable()
export class Web3Service {
  private web3: any;
  private accounts: string[];

  public ready = false;

  public accountsObservable = new Subject<string[]>();
  public XCHFBalanceObservable = new Subject<number>();
  public ALEQBalanceObservable = new Subject<number>();
  public ALEQAvailableObservable = new Subject<number>();
  public ALEQTotalObservable = new Subject<number>();
  public SharePriceObservable = new Subject<number>();
  public MaxCanBuyObservable = new Subject<number>();



  constructor(private matSnackBar: MatSnackBar) {
    window.addEventListener('load', (event) => {
      this.bootstrapWeb3();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, { duration: 6000, verticalPosition: 'top' });
  }

  public async bootstrapWeb3() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.ethereum !== 'undefined') {
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.ethereum);
      console.log("WEB3:", this.web3)
      try {
        let MM = await window.ethereum.enable();
        this.setStatus('MetaMask enabled!');
      }
      catch{
        this.setStatus('There was an error enabling MetaMask');
      }

    } else {
      this.setStatus('Please use MetaMask if you want to buy shares');

      // Hack to provide backwards compatibility for Truffle, which uses web3js 0.20.x
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail);
      this.web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/2a59f4ddc9b14dd5b321f5fbee33f77d'));

      // this.web3 = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/2a59f4ddc9b14dd5b321f5fbee33f77d"));
    }

    setInterval(() => this.refreshAccounts(), 100);
  }

  public async artifactsToContract(artifacts) {
    if (!this.web3) {
      const delay = new Promise(resolve => setTimeout(resolve, 100));
      await delay;
      return await this.artifactsToContract(artifacts);
    }

    const contractAbstraction = contract(artifacts);
    contractAbstraction.setProvider(this.web3.currentProvider);
    return contractAbstraction;
  }

  public async createBatch() {
    return await this.web3.createBatch();
  }

  public async toBigNumber(number) {
    return this.web3.utils.toBN(number);
  }

  async getXCHFBalance(acc) {
    try {
      let XCHFAbstraction = await this.artifactsToContract(XCHF_artifacts);
      let XCHFInstance = await XCHFAbstraction.at(XCHFAddress);
      let bal = new Big(await XCHFInstance.balanceOf.call(acc));
      return bal;
    }
    catch (error) {
      console.log(error);
    }
  }

  async getALEQBalance(acc) {
    try {
      let ALEQAbstraction = await this.artifactsToContract(ALEQ_artifacts);
      let ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      let bal = new Big(await ALEQInstance.balanceOf.call(acc));
      return bal;
    }
    catch (error) {
      console.log(error);
    }
  }

  async getALEQTotal() {
    try {
      let ALEQAbstraction = await this.artifactsToContract(ALEQ_artifacts);
      let ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      let total = new Big(await ALEQInstance.totalShares.call());
      return total;
    }
    catch (error) {
      console.log(error);
    }
  }

  async getALEQAvailable() {
    try {
      let SDAbstraction = await this.artifactsToContract(SD_artifacts);
      let SDInstance = await SDAbstraction.at(SDAddress);
      let available = new Big(await SDInstance.getAvailableSupply.call());
      return available;
    }
    catch (error) {
      console.log(error);
    }
  }

  async getSharePrice() {
    try {
      let SDAbstraction = await this.artifactsToContract(SD_artifacts);
      let SDInstance = await SDAbstraction.at(SDAddress);
      let sharePrice = new Big(await SDInstance.sharePriceInXCHF.call());
      return sharePrice.div(10 ** 18);
    }
    catch (error) {
      console.log(error);
    }
  }

  private refreshAccounts() {
    this.web3.eth.getAccounts(async (err, accs) => {
      console.log('Refreshing accounts');
      if (err != null) {
        console.warn('There was an error fetching your accounts.');
        return;
      }

      // Get the initial account balance so it can be displayed.
      if (accs.length === 0) {
        console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
        console.log('Observed new accounts');
        this.accountsObservable.next(accs);
        this.accounts = accs;
        this.balanceRefresh();
      }

      this.ready = true;
    });
  }

  public async balanceRefresh() {
    let XCHFbal = await this.getXCHFBalance(this.accounts[0]);
    this.XCHFBalanceObservable.next(XCHFbal.div(10 ** 18));

    let ALEQbal = await this.getALEQBalance(this.accounts[0]);
    this.ALEQBalanceObservable.next(ALEQbal);

    let ALEQTot = await this.getALEQTotal();
    this.ALEQTotalObservable.next(ALEQTot);

    let ALEQSup = await this.getALEQAvailable();
    this.ALEQAvailableObservable.next(ALEQSup);

    let sp = await this.getSharePrice();

    let maxBuy = XCHFbal.div(sp * 10 ** 18);
    this.MaxCanBuyObservable.next(maxBuy);

    let sp2 = await this.getSharePrice();
    this.SharePriceObservable.next(sp2);
  }




}
