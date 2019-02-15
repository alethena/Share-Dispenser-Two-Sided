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
    private matDividerModule: MatDividerModule) { }

  async openBuyPopup() {
    this.buyPopup = false;
    this.buyPopup2 = true;
    await delay(4000);
    this.checkbox2 = true;
    console.log(this.data.amount);
  }

  async buyShares() {
    this.buyPopup2 = false;
    this.MMPopup = true;

    // } else if (Number(this.numberOfSharesToBuy.toString(10)) < 20 || Number(this.numberOfSharesToBuy.toString(10)) > Number(this.ALEQAvailable.toString())) {

    // this.web3Service.setStatus('Please select a number of shares between 20 and ' + this.ALEQAvailable + '.');
    // console.log(this.numberOfSharesToBuy, this.ALEQAvailable);

    // } else if (Math.round(Number(this.numberOfSharesToBuy.toString(10))) !== Number(this.numberOfSharesToBuy.toString(10))) {

    //   this.web3Service.setStatus('Please select an integer number of shares to buy.');

    // } else {
    // this.buttonLocked = true;
    try {
      const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
      const SDInstance = await SDAbstraction.at(SDAddress);

      // const sharePrice = await new BN(await SDInstance.sharePriceInXCHF.call(), 10);
      // const price = sharePrice.mul(await new BN(this.numberOfSharesToBuy));

      const XCHFAbstraction = await this.web3Service.artifactsToContract(XCHF_artifacts);
      const XCHFInstance = await XCHFAbstraction.at(XCHFAddress);

      // this.web3Service.setStatus(
      //   'Transaction started! \
      //   \n Please accept the MetaMask pop-up to authorise payment and wait for the confirmation. \
      //    \n This process can take up to a minute.'
      // );

      // await delay(6000);
      // console.log(this.data.price);
      // console.log(this.data.price.toString());
      // console.log(this.data.price.toString(10));

      // let temp = new BN(this.data.price.toString(10), 16);
      // console.log(temp.toString(10));


      const temp = await this.dispenserService.getBuyPrice(this.data.amount);

      const hash = await XCHFInstance.approve.sendTransaction(SDAddress, temp, { from: this.data.address });
      this.MMPopup = false;
      this.FirstSucceded = true;



      // this.web3Service.setStatus(
      //   'Payment authorisation suceeded, \
      // please finalise the transaction by accepting the second MetaMask pop-up.'
      // );

      await delay(4000);
      // const hash2 = await XCHFInstance.approve.sendTransaction(SDAddress, 20000, { from: this.data.address });
      await SDInstance.buyShares.sendTransaction(this.data.amount, { from: this.data.address });

      this.FirstSucceded = false;
      this.SecondSucceded = true;
      // await SDInstance.buyShares.sendTransaction(this.numberOfSharesToBuy, { from: this.account });
      // this.dispenserService.balanceRefresh();
      // this.web3Service.setStatus('The transfer suceeded, welcome as a shareholder at Alethena!');

      // await delay(6000);

      // this.web3Service.setStatus('Please proceed to alethena.ledgy.com to register your address.');
      // this.buttonLocked = false;

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

  numberOfSharesToBuy = 20;
  numberOfSharesToSell = 0;
  XCHFBalance = 0;
  ALEQBalance = 0;
  ALEQAvailable = 0;
  ALEQTotal = 0;
  maxCanBuy = 0;
  SD: any;
  XCHF: any;

  constructor(
    public dialog: MatDialog,
    private web3Service: Web3Service,
    private dispenserService: DispenserService,
    private matSnackBar: MatSnackBar,
    private matDividerModule: MatDividerModule
  ) { }


  openDialog() {
    this.checkbox = false;
    this.dialog.open(DialogComponent, {
      disableClose: true,
      data: { address: this.account, amount: this.numberOfSharesToBuy, price: this.totalPrice }
    });
  }

  openBalances() {
    this.dialog.open(BalanceComponent, {
      data: { address: this.account, ALEQ: this.ALEQBalance, XCHF: this.XCHFBalance }
    });
  }


  ngOnInit(): void {
    // console.log('OnInit: ' + this.web3Service);
    this.watchAccount();
    this.numberOfSharesToBuyChanged()
  }

  async numberOfSharesToBuyChanged() {
    const total = new Big(await this.dispenserService.getBuyPrice(this.numberOfSharesToBuy));
    this.totalPrice = total;
    this.totalPriceDisp = Math.ceil(total.div(10 ** 18) * 100) / 100;
    this.pricePerShare = Math.ceil(total.div(this.numberOfSharesToBuy).div(10 ** 18) * 100) / 100;
  }
  async setMaxCanBuy() {
    this.numberOfSharesToBuy = this.maxCanBuy;
    await this.numberOfSharesToBuyChanged();
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



    // this.dispenserService.MaxCanBuyObservable.subscribe((total) => {
    //   this.maxCanBuy = parseInt(total.toString(10), 10);
    //   if (this.ALEQAvailable < this.maxCanBuy) {
    //     this.maxCanBuy = this.ALEQAvailable;
    //   }
    //   if (this.numberOfSharesToBuy == 0) {
    //     this.setAmount({ 'target': { 'value': this.maxCanBuy } });
    //   }
    // });

    // this.dispenserService.SharePriceObservable.subscribe((sp) => {
    //   this.pricePerShare = sp;
    //   this.totalPrice = sp * this.numberOfSharesToBuy;
    // });

  }
}


