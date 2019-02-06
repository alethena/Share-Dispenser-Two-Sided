import { Web3Service } from './web3.service';
import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';
import { Big } from 'big.js';
declare let require: any;


const contractAddresses = require('../../assets/contractAddresses.json');

const XCHF_artifacts = require('../../assets/contracts/CryptoFranc.json');
const XCHFAddress = contractAddresses.XCHFAddress;

const SD_artifacts = require('../../assets/contracts/ShareDispenser.json');
const SDAddress = contractAddresses.SDAddress;

const ALEQ_artifacts = require('../../assets/contracts/AlethenaShares.json');
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
      const available = new Big(await SDInstance.getAvailableSupply.call());
      return available;
    } catch (error) {
      console.log(error);
    }
  }

  async getSharePrice() {
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);
      const sharePrice = new Big(await SDInstance.sharePriceInXCHF.call());
      return sharePrice.div(10 ** 18);
    } catch (error) {
      console.log(error);
    }
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
    } catch(error) {}
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

    const sp = await this.getSharePrice();

    const maxBuy = XCHFbal.div(sp * 10 ** 18);
    this.MaxCanBuyObservable.next(maxBuy);

    const sp2 = await this.getSharePrice();
    this.SharePriceObservable.next(sp2);
  }



}
