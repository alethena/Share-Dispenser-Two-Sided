import { Web3Service } from './web3.service';
import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';
import { Big } from 'big.js';
declare let require: any;


const contractAddresses = require('../../assets/contractAddresses.json');

const XCHF_artifacts = require('../../../../Solidity/build/contracts/CryptoFranc.json');
const XCHFAddress = contractAddresses.XCHFAddress;

const SD_artifacts = require('../../../../Solidity/build/contracts/ShareDispenser.json');
const SDAddress = contractAddresses.SDAddress;

const ALEQ_artifacts = require('../../../../Solidity/build/contracts/AlethenaShares.json');
const ALEQAddress = contractAddresses.ALEQAddress;


@Injectable({
  providedIn: 'root'
})
export class DispenserService {
  public accountsObservable = new Subject<string[]>();
  public XCHFBalanceObservable = new Subject<number>();
  public ALEQBalanceObservable = new Subject<number>();
  public ALEQAvailableObservable = new Subject<number>();
  public ALEQTotalObservable = new Subject<number>();
  public SharePriceObservable = new Subject<number>();
  public MaxCanBuyObservable = new Subject<number>();
  public MaxBuyBackObservable = new Subject<number>();


  private accounts: string[];

  constructor(private web3Service: Web3Service) {
    this.bootstrapAccounts();
  }

  public async bootstrapAccounts() {
    this.noMMGet();
    setInterval(() => this.refreshAccounts(), 100);
  }

  async getXCHFBalance(acc) {
    try {
      const XCHFAbstraction = await this.web3Service.artifactsToContract(XCHF_artifacts);
      const XCHFInstance = await XCHFAbstraction.at(XCHFAddress);
      const bal = new Big(await XCHFInstance.balanceOf.call(acc));
      return bal;
    } catch (error) {
    }
  }

  async getALEQBalance(acc) {
    try {
      const ALEQAbstraction = await this.web3Service.artifactsToContract(ALEQ_artifacts);
      const ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      const bal = new Big(await ALEQInstance.balanceOf.call(acc));
      return bal;
    } catch (error) {
    }
  }

  async getALEQTotal() {
    try {
      const ALEQAbstraction = await this.web3Service.artifactsToContract(ALEQ_artifacts);
      const ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      const total = new Big(await ALEQInstance.totalShares.call());
      return total;
    } catch (error) {
    }
  }

  async getALEQAvailable() {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const available = new Big(await SDInstance.getERC20Balance.call(ALEQAddress));
      return available;
    } catch (error) {
    }
  }

  async getXCHFAvailable() {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const available = new Big(await SDInstance.getERC20Balance.call(XCHFAddress));
      return available;
    } catch (error) {
    }
  }

  public async getBuyPrice(numberToBuy) {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const supply = new Big(await SDInstance.getERC20Balance.call(ALEQAddress));
      const numberToBuyBN = new Big(numberToBuy);
      const price = await SDInstance.getCumulatedPrice.call(numberToBuyBN.toString(10), supply.toString(10));
      return price;
    } catch (error) {
    }
  }

  public async getBuyBackPrice(numberToSell) {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const supply = new Big(await SDInstance.getERC20Balance.call(ALEQAddress));
      const numberToSellBN = new Big(numberToSell);
      const price = await SDInstance.getCumulatedBuyBackPrice.call(numberToSellBN.toString(10), supply.toString(10));
      return price;
    } catch (error) {
    }
  }

  public async getMaxCanBuy() {
    const totalShares = await this.getALEQAvailable();
    let buyerXCHF = await this.getXCHFBalance(this.accounts[0]);
    buyerXCHF = Number(buyerXCHF.div(10 ** 18).toString(10));

    if (buyerXCHF === 0) {
      return 0;
    }
    let power = 0;
    let temp = 0;

    // Find smallest power of two larger than total number of shares
    while (2 ** (power + 1) < totalShares) {
      power += 1;
    }

    // Now do binary search to find max allowed value
    let iter = 2 ** (power);
    while (power > 0) {
      power -= 1;

      temp = await this.compareValue(iter);

      if (temp < buyerXCHF) {
        iter += 2 ** (power);
      } else if (temp > buyerXCHF) {
        iter -= 2 ** (power);
      } else if (temp === buyerXCHF) {
        return (iter <= totalShares) ? iter : totalShares;
      }
    }
    const high = await this.compareValue(iter + 1);
    const current = await this.compareValue(iter);

    if (high < buyerXCHF) {
      iter += 1;
    } else if (current > buyerXCHF) {
      iter -= 1;
    }

    return (iter <= totalShares) ? iter : totalShares;
  }

  public async getMaxBuyBack() {

    let totalXCHF = await this.getXCHFAvailable();
    const totalALEQ = await this.getALEQTotal();

    totalXCHF = Number(totalXCHF.div(10 ** 18).toString(10));

    if (totalALEQ === 0) {
      return 0;
    }

    let power = 0;
    let temp = 0;

    // Find smallest power of two larger than total number of shares
    while (2 ** (power + 1) < totalALEQ) {
      power += 1;
    }

    // Now do binary search to find max allowed value
    let iter = 2 ** (power);
    while (power > 0) {
      // console.log("Calc:", iter);

      power -= 1;

      temp = await this.compareValueSell(iter);

      if (temp < totalXCHF) {
        iter += 2 ** (power);
      } else if (temp > totalXCHF) {
        iter -= 2 ** (power);
      } else if (temp === totalXCHF) {
        
        return (iter <= totalALEQ) ? iter : totalALEQ;
      }
    }
    const high = await this.compareValueSell(iter + 1);
    const current = await this.compareValueSell(iter);

    if (high < totalXCHF) {
      iter += 1;
    } else if (current > totalXCHF) {
      iter -= 1;
    }

    return (iter <= totalALEQ) ? iter : totalALEQ;
  }

  private async compareValue(numberOfShares) {
    let temp = new Big(await this.getBuyPrice(numberOfShares));
    temp = Number(temp.div(10 ** 18).toString(10));
    return temp;
  }

  private async compareValueSell(numberOfShares) {
    let temp = new Big(await this.getBuyBackPrice(numberOfShares));
    temp = Number(temp.div(10 ** 18).toString(10));
    return temp;
  }


  private async noMMGet() {
    const ALEQTot = await this.getALEQTotal();
    this.ALEQTotalObservable.next(ALEQTot);

    const ALEQSup = await this.getALEQAvailable();
    this.ALEQAvailableObservable.next(ALEQSup);

    const maxSell = await this.getMaxBuyBack();
    this.MaxBuyBackObservable.next(maxSell);

  }

  private async refreshAccounts() {
    if (this.web3Service.MM) {
      try {
        const accs = await this.web3Service.getAccounts();
        // console.log('Refreshing accounts');
        this.balanceRefreshAlways();
        // Get the initial account balance so it can be displayed.
        if (accs.length === 0) {
          console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
          return;
        }

        if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
          // console.log('Observed new accounts');
          this.accountsObservable.next(accs);
          this.accounts = accs;
          this.balanceRefresh();
        }
      } catch (error) { }
    }

  }

  public async balanceRefresh() {


    const maxCanBuy = await this.getMaxCanBuy();
    this.MaxCanBuyObservable.next(maxCanBuy);

    const maxBuyBack = await this.getMaxBuyBack();
    this.MaxBuyBackObservable.next(maxBuyBack);

  }

  public async balanceRefreshAlways() {
    if (this.accounts) {

      const ALEQTot = await this.getALEQTotal();
      this.ALEQTotalObservable.next(ALEQTot);
  
      const ALEQSup = await this.getALEQAvailable();
      this.ALEQAvailableObservable.next(ALEQSup);
      
      const XCHFbal = await this.getXCHFBalance(this.accounts[0]);
      this.XCHFBalanceObservable.next(XCHFbal.div(10 ** 18));

      const ALEQbal = await this.getALEQBalance(this.accounts[0]);
      this.ALEQBalanceObservable.next(ALEQbal);
    }
  }



}
