import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { DispenserService } from '../../util/dispenser.service';
import { MatSnackBar } from '@angular/material';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule, MatMenuModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { delay } from 'q';



declare let require: any;

const BN = require('bn.js');
const contractAddresses = require('../../../assets/contractAddresses.json');

const XCHF_artifacts = require('../../../assets/contracts/CryptoFranc.json');
const XCHFAddress = contractAddresses.XCHFAddress;

const SD_artifacts = require('../../../assets/contracts/ShareDispenser.json');
const SDAddress = contractAddresses.SDAddress;

@Component({
  selector: 'app-share-dispenser',
  templateUrl: './share-dispenser.component.html',
  styleUrls: ['./share-dispenser.component.css']
})
export class ShareDispenserComponent implements OnInit {
  accounts: string[];
  account: string;

  buyOrSell = false;
  totalPrice = 0;
  pricePerShare = 0;
  numberOfSharesToBuy = 0;
  numberOfSharesToSell = 0;
  XCHFBalance = 0;
  ALEQBalance = 0;
  ALEQAvailable = 0;
  ALEQTotal = 0;
  maxCanBuy = 0;


  shareTokenTerms = false;
  privacyPolicy = false;
  prospectus = false;
  buttonLocked = false;

  SD: any;
  XCHF: any;
  constructor(
    private web3Service: Web3Service, 
    private dispenserService: DispenserService, 
    private matSnackBar: MatSnackBar, 
    private matDividerModule: MatDividerModule
    ) {}

  ngOnInit(): void {
    // console.log('OnInit: ' + this.web3Service);
    this.watchAccount();

  }

  setAmount(e) {
    // console.log('Setting amount: ' + e.target.value);
    this.numberOfSharesToBuy = e.target.value;
    this.totalPrice = e.target.value * this.pricePerShare;
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
      this.ALEQAvailable = available;
    });

    this.dispenserService.ALEQTotalObservable.subscribe((total) => {
      this.ALEQTotal = total;
    });

    this.dispenserService.SharePriceObservable.subscribe((sp) => {
      this.pricePerShare = sp;
    });

    this.dispenserService.MaxCanBuyObservable.subscribe((total) => {
      this.maxCanBuy = parseInt(total.toString(10), 10);
      if (this.ALEQAvailable < this.maxCanBuy) {
        this.maxCanBuy = this.ALEQAvailable;
      }
      if (this.numberOfSharesToBuy == 0) {
        this.setAmount({ 'target': { 'value': this.maxCanBuy } });
      }
    });

    this.dispenserService.SharePriceObservable.subscribe((sp) => {
      this.pricePerShare = sp;
      this.totalPrice = sp * this.numberOfSharesToBuy;
    });

  }

  async buyShares() {

    if (this.buttonLocked) {

    } else if (this.shareTokenTerms === false || this.privacyPolicy === false || this.prospectus === false) {
      this.web3Service.setStatus('Please accept our share token terms, privacy policy and prospectus');

    } else if (Number(this.numberOfSharesToBuy.toString(10)) < 20 || Number(this.numberOfSharesToBuy.toString(10)) > Number(this.ALEQAvailable.toString())) {

      this.web3Service.setStatus('Please select a number of shares between 20 and ' + this.ALEQAvailable + '.');
      // console.log(this.numberOfSharesToBuy, this.ALEQAvailable);

    } else if (Math.round(Number(this.numberOfSharesToBuy.toString(10))) !== Number(this.numberOfSharesToBuy.toString(10))) {

      this.web3Service.setStatus('Please select an integer number of shares to buy.');

    } else {
      this.buttonLocked = true;
      try {
        const SDAbstraction = await this.web3Service.artifactsToContract(SD_artifacts);
        const SDInstance = await SDAbstraction.at(SDAddress);

        const sharePrice = await new BN(await SDInstance.sharePriceInXCHF.call(), 10);
        const price = sharePrice.mul(await new BN(this.numberOfSharesToBuy));

        const XCHFAbstraction = await this.web3Service.artifactsToContract(XCHF_artifacts);
        const XCHFInstance = await XCHFAbstraction.at(XCHFAddress);

        this.web3Service.setStatus(
          'Transaction started! \
          \n Please accept the MetaMask pop-up to authorise payment and wait for the confirmation. \
           \n This process can take up to a minute.'
        );

        await delay(6000);

        await XCHFInstance.approve.sendTransaction(SDAddress, price.toString(10), { from: this.account });

        this.web3Service.setStatus(
          'Payment authorisation suceeded, \
        please finalise the transaction by accepting the second MetaMask pop-up.'
        );

        await delay(4000);

        await SDInstance.buyShares.sendTransaction(this.numberOfSharesToBuy, { from: this.account });
        this.dispenserService.balanceRefresh();
        this.web3Service.setStatus('The transfer suceeded, welcome as a shareholder at Alethena!');

        await delay(6000);

        this.web3Service.setStatus('Please proceed to alethena.ledgy.com to register your address.');
        this.buttonLocked = false;

      } catch (error) {
        this.web3Service.setStatus('An error occured during the transaction!');
        this.buttonLocked = false;
        console.log(error);
      }
    }
  }



}
