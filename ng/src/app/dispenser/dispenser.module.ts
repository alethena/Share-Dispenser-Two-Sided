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
  MatMenuModule
} from '@angular/material';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


@NgModule({
  declarations: [ShareDispenserComponent],
  imports: [
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
    MatTabsModule,
    RouterModule,
    UtilModule
  ],
  exports: [ShareDispenserComponent]
})
export class DispenserModule { }


