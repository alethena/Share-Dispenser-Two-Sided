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
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.ethereum);
      try {
        const MM = await window.ethereum.enable();
        this.setStatus('MetaMask enabled!');
      } catch {
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
    return out;
  }

}
