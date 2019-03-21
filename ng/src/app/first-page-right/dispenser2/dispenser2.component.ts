import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../../util/web3.service';

import { DispenserService } from '../../util/dispenser.service';
import { MatSnackBar } from '@angular/material';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule, MatMenuModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { delay } from 'q';
import { ThrowStmt } from '@angular/compiler';
// import { E2BIG } from 'constants';

declare let require: any;
import { Big } from 'big.js';

const BN = require('bn.js');
const contractAddresses = require('../../../assets/contractAddresses.json');

const XCHF_artifacts = require('../../../../../Solidity/build/contracts/CryptoFranc.json');
const XCHFAddress = contractAddresses.XCHFAddress;

const SD_artifacts = require('../../../../../Solidity/build/contracts/ShareDispenser.json');
const SDAddress = contractAddresses.SDAddress;

const ALEQ_artifacts = require('../../../../../Solidity/build/contracts/AlethenaShares.json');
const ALEQAddress = contractAddresses.ALEQAddress;


export interface DialogData {
  address: string;
  amount: number;
  price: number;
}

export interface DialogData2 {
  address: string;
  ALEQ: number;
  XCHF: number;
}


@Component({
  selector: 'app-balance',
  templateUrl: 'balance.html',
  styleUrls: ['balance.scss']

})
export class BalanceComponent {
  public ALEQ = 0;
  public XCHF = 0;
  public account;

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: DialogData2,
    public dialog: MatDialog,
  ) {
    this.ALEQ = this.data.ALEQ;
    this.XCHF = this.data.XCHF;
    this.account = this.data.address;
  }
}

@Component({
  selector: 'app-dialog',
  templateUrl: 'dialog.html',
})
export class DialogComponent {

  buyPopup = true;
  buyPopup2 = false;
  MMPopup = false;
  FirstSucceded = false;
  SecondSucceded = false;
  checkbox2 = false;

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: DialogData,
    public dialog: MatDialog,
    private web3Service: Web3Service,
    private dispenserService: DispenserService,
    private matSnackBar: MatSnackBar,
    private matDividerModule: MatDividerModule) {

  }

  async openBuyPopup() {
    this.buyPopup = false;
    this.buyPopup2 = true;
    await delay(4000);
    this.checkbox2 = true;
    // console.log(this.data.amount);
  }

  async buyShares() {
    this.buyPopup2 = false;
    this.MMPopup = true;

    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);

      const XCHFAbstraction = await this.web3Service.artifactsToContract(XCHF_artifacts);
      const XCHFInstance = await XCHFAbstraction.at(XCHFAddress);

      const temp = await this.dispenserService.getBuyPrice(this.data.amount);

      const hash = await XCHFInstance.approve.sendTransaction(SDAddress, temp, { from: this.data.address });
      this.MMPopup = false;
      this.FirstSucceded = true;

      await delay(4000);
      await SDInstance.buyShares.sendTransaction(this.data.amount, { from: this.data.address });

      this.FirstSucceded = false;
      this.SecondSucceded = true;


    } catch (error) {
      this.web3Service.setStatus('An error occured during the transaction!');
      this.dialog.closeAll();
      console.log(error);
    }
    // }
  }

}







@Component({
  selector: 'app-dialog-sell',
  templateUrl: 'dialog-sell.html',
})
export class DialogSellComponent {

  buyPopup = true;
  buyPopup2 = false;
  MMPopup = false;
  FirstSucceded = false;
  SecondSucceded = false;
  checkbox2 = false;

  constructor(@Inject(MAT_DIALOG_DATA)
  public data: DialogData,
    public dialog: MatDialog,
    private web3Service: Web3Service,
    private dispenserService: DispenserService,
    private matSnackBar: MatSnackBar,
    private matDividerModule: MatDividerModule) {

  }

  async openBuyPopup() {
    this.buyPopup = false;
    this.buyPopup2 = true;
    await delay(4000);
    this.checkbox2 = true;
    // console.log(this.data.amount);
  }

  async sellShares() {
    this.buyPopup2 = false;
    this.MMPopup = true;

    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);

      const ALEQAbstraction = await this.web3Service.artifactsToContract(ALEQ_artifacts);
      const ALEQInstance = await ALEQAbstraction.at(ALEQAddress);

      // const supply = await ALEQInstance.balanceOf(SDAddress);

      const temp = await this.dispenserService.getBuyBackPrice(this.data.amount);
      // console.log(temp.toString());

      const hash = await ALEQInstance.approve.sendTransaction(SDAddress, this.data.amount, { from: this.data.address });
      this.MMPopup = false;
      this.FirstSucceded = true;

      await delay(4000);
      const log = await SDInstance.sellShares.sendTransaction(this.data.amount, temp, { from: this.data.address });
      // console.log(log);
      this.FirstSucceded = false;
      this.SecondSucceded = true;


    } catch (error) {
      this.web3Service.setStatus('An error occured during the transaction!');
      this.dialog.closeAll();
      console.log(error);
    }
    // }
  }

}






@Component({
  selector: 'app-dispenser2',
  templateUrl: './dispenser2.component.html',
  styleUrls: ['./dispenser2.component.scss']
})
export class Dispenser2Component implements OnInit {
  checkbox: boolean;
  accounts: string[];
  account: string;

  totalPrice = 0;
  totalPriceDisp = 0;
  public pricePerShare = 0;

  totalPriceSell = 0;
  totalPriceDispSell = 0;
  public pricePerShareSell = 0;

  numberOfSharesToBuy = 20;
  numberOfSharesToSell = 20;
  XCHFBalance = 0;
  ALEQBalance = 0;
  ALEQAvailable = 0;
  ALEQTotal = 0;
  maxCanBuy = 20;
  maxBuyBack = 20;
  maxLocked = false;
  SD: any;
  XCHF: any;

  constructor(
    public dialog: MatDialog,
    private web3Service: Web3Service,
    private dispenserService: DispenserService,
    private matSnackBar: MatSnackBar,
    private matDividerModule: MatDividerModule
  ) {
    this.numberOfSharesToBuyChanged();
    this.numberOfSharesToSellChanged();

  }


  openDialog() {
    if (this.web3Service.MM) {
      this.checkbox = false;
      this.dialog.open(DialogComponent, {
        disableClose: true,
        data: { address: this.account, amount: this.numberOfSharesToBuy, price: this.totalPrice }
      });
    } else {
      this.web3Service.setStatus('Please use MetaMask to buy or sell shares.');
    }
  }

  openSellDialog() {
    if (this.web3Service.MM) {
      this.checkbox = false;
      this.dialog.open(DialogSellComponent, {
        disableClose: true,
        data: { address: this.account, amount: this.numberOfSharesToSell, price: this.totalPriceSell }
      });
    } else {
      this.web3Service.setStatus('Please use MetaMask to buy or sell shares.');
    }
  }

  openBalances() {
    this.dialog.open(BalanceComponent, {
      data: { address: this.account, ALEQ: this.ALEQBalance, XCHF: this.XCHFBalance }
    });
  }


  ngOnInit(): void {
    // console.log('OnInit: ' + this.web3Service);
  
    this.numberOfSharesToBuy = 20;
    this.watchAccount();
    this.numberOfSharesToBuyChanged();
    try {
      this.setMaxCanBuy();
    } catch (error) {
    }
  }

  async numberOfSharesToBuyChanged() {
    if (this.numberOfSharesToBuy > this.ALEQAvailable) {
      this.numberOfSharesToBuy = this.ALEQAvailable;
    }

    if (this.numberOfSharesToBuy < 20) {
      this.numberOfSharesToBuy = 20;
    }

    try {
      const total = new Big(await this.dispenserService.getBuyPrice(this.numberOfSharesToBuy));
      this.totalPrice = total;
      this.totalPriceDisp = Math.ceil(total.div(10 ** 18));
      this.pricePerShare = Math.ceil(total.div(this.numberOfSharesToBuy).div(10 ** 18) * 100) / 100;
    } catch (error) {
    }

  }

  async numberOfSharesToSellChanged() {
    // console.log("Called");
    if (this.numberOfSharesToSell < 20) {
      this.numberOfSharesToSell = 20;
    }
    // } else if (this.numberOfSharesToSell > this.ALEQTotal) {
    //   this.numberOfSharesToSell = this.ALEQTotal;
    // }
    try {
      const total = new Big(await this.dispenserService.getBuyBackPrice(this.numberOfSharesToSell));
      this.totalPriceSell = total;
      this.totalPriceDispSell = Math.ceil(total.div(10 ** 18));
      this.pricePerShareSell = Math.ceil(total.div(this.numberOfSharesToSell).div(10 ** 18) * 100) / 100;

    } catch (error) {
    }

  }
  async setMaxCanBuy() {
    if (this.web3Service.MM) {
      await this.numberOfSharesToBuyChanged();
      this.numberOfSharesToBuy = this.maxCanBuy;
      await this.numberOfSharesToBuyChanged();
      await delay(3000);
    } else {
      // this.web3Service.setStatus('Please use MetaMask to buy shares.');
    }
  }

  async setMaxCanSell() {
    if (this.web3Service.MM) {
      await this.numberOfSharesToSellChanged();
      this.numberOfSharesToSell = (this.maxBuyBack <= this.ALEQBalance) ? this.maxBuyBack : this.ALEQBalance;
      await this.numberOfSharesToSellChanged();
      await delay(3000);
    } else {
      // this.web3Service.setStatus('Please use MetaMask to buy shares.');
    }
  }

  watchAccount() {
    this.dispenserService.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
    });

    this.dispenserService.XCHFBalanceObservable.subscribe((bal) => {
      this.XCHFBalance = Math.round(bal);
    });

    this.dispenserService.ALEQBalanceObservable.subscribe((bal) => {
      this.ALEQBalance = bal;
    });

    this.dispenserService.ALEQAvailableObservable.subscribe((available) => {
      this.ALEQAvailable = Number(available.toString());
    });

    this.dispenserService.ALEQTotalObservable.subscribe((total) => {
      this.ALEQTotal = Number(total.toString());
    });

    this.dispenserService.MaxCanBuyObservable.subscribe((max) => {
      this.maxCanBuy = Number(max.toString());
    });

    this.dispenserService.MaxBuyBackObservable.subscribe((max) => {
      this.maxBuyBack = Number(max.toString());
    });
  }
}


