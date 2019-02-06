import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Web3Service} from './web3.service';
import { DispenserService } from './dispenser.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    Web3Service,
    DispenserService
  ],
  declarations: []
})
export class UtilModule {
}
