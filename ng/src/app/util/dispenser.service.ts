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

  private accounts: string[];

  constructor(private web3Service: Web3Service) {
    this.bootstrapAccounts();
  }

  public async bootstrapAccounts() {
    setInterval(() => this.refreshAccounts(), 100);
  }

  async getXCHFBalance(acc) {
    try {
      const XCHFAbstraction = await this.web3Service.artifactsToContract(XCHF_artifacts);
      const XCHFInstance = await XCHFAbstraction.at(XCHFAddress);
      const bal = new Big(await XCHFInstance.balanceOf.call(acc));
      return bal;
    } catch (error) {
      console.log(error);
    }
  }

  async getALEQBalance(acc) {
    try {
      const ALEQAbstraction = await this.web3Service.artifactsToContract(ALEQ_artifacts);
      const ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      const bal = new Big(await ALEQInstance.balanceOf.call(acc));
      return bal;
    } catch (error) {
      console.log(error);
    }
  }

  async getALEQTotal() {
    try {
      const ALEQAbstraction = await this.web3Service.artifactsToContract(ALEQ_artifacts);
      const ALEQInstance = await ALEQAbstraction.at(ALEQAddress);
      const total = new Big(await ALEQInstance.totalShares.call());
      return total;
    } catch (error) {
      console.log(error);
    }
  }

  async getALEQAvailable() {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const available = new Big(await SDInstance.getERC20Balance.call(ALEQAddress));
      // console.log("Test:", SDInstance, available.toString(10));
      return available;
    } catch (error) {
      console.log(error);
    }
  }

  public async getBuyPrice(numberToBuy) {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      // console.log(SDInstance);
      const supply = new Big(await SDInstance.getERC20Balance.call(ALEQAddress));
      const numberToBuyBN = new Big(numberToBuy);
      // console.log('Data:', supply, numberToBuyBN);
      const price = await SDInstance.getCumulatedPrice.call(numberToBuyBN.toString(10), supply.toString(10));
      return price;
    } catch (error) {
      console.log(error);
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

  private async compareValue(numberOfShares) {
    let temp = new Big(await this.getBuyPrice(numberOfShares));
    temp = Number(temp.div(10 ** 18).toString(10));
    return temp;
  }


  private async refreshAccounts() {
    try {
      const accs = await this.web3Service.getAccounts();
      console.log('Refreshing accounts');
      // if (err != null) {
      //   console.warn('There was an error fetching your accounts.');
      //   return;
      // }

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
    } catch (error) { }
  }

  public async balanceRefresh() {
    const XCHFbal = await this.getXCHFBalance(this.accounts[0]);
    this.XCHFBalanceObservable.next(XCHFbal.div(10 ** 18));

    const ALEQbal = await this.getALEQBalance(this.accounts[0]);
    this.ALEQBalanceObservable.next(ALEQbal);

    const ALEQTot = await this.getALEQTotal();
    this.ALEQTotalObservable.next(ALEQTot);

    const ALEQSup = await this.getALEQAvailable();
    this.ALEQAvailableObservable.next(ALEQSup);

    const maxCanBuy = await this.getMaxCanBuy();
    this.MaxCanBuyObservable.next(maxCanBuy);

    // const sp2 = await this.getSharePrice();
    // this.SharePriceObservable.next(sp2);
  }



}