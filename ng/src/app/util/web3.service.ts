import { Injectable } from '@angular/core';
import contract from 'truffle-contract';
import { MatSnackBar } from '@angular/material';
import { Big } from 'big.js';

import { Subject } from 'rxjs';
declare let require: any;
const Web3 = require('web3');


declare let window: any;


@Injectable()
export class Web3Service {
  public web3: any;
  public MM: any;
  // public ready = false;


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
      try {
        this.MM = await window.ethereum.enable();
      } catch (error) { }
    }
    if ((typeof window.ethereum !== 'undefined') || (typeof window.web3 !== 'undefined')) {
      const provider = window['ethereum'] || window.web3.currentProvider;
      this.web3 = new Web3(provider);
      Web3.providers.WebsocketProvider.prototype.sendAsync = Web3.providers.WebsocketProvider.prototype.send;

      // Hack to provide backwards compatibility for Truffle, which uses web3js 0.20.x
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail);
    } else {
      Web3.providers.WebsocketProvider.prototype.sendAsync = Web3.providers.WebsocketProvider.prototype.send;

      this.web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/e7ec903e54b9473598306368d84a517b'));
    }
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

  public async getAccounts() {
    // console.log(this.web3);
    let out;
    if (this.web3) {
      out = await this.web3.eth.getAccounts();
    }
    // console.log(out);
    return out;
  }

}
