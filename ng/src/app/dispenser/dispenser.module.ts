import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ShareDispenserComponent } from './share-dispenser/share-dispenser.component';
import {UtilModule} from '../util/util.module';
import {RouterModule} from '@angular/router';


import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatDividerModule,
  MatOptionModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTabsModule,
  MatCheckboxModule,
  MatMenuModule,
  MatSliderModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [ShareDispenserComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSliderModule,
    MatTabsModule,
    RouterModule,
    UtilModule
  ],
  exports: [ShareDispenserComponent]
})
export class DispenserModule { }


