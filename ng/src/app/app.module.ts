import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EmbedVideo } from 'ngx-embed-video';

import { AppComponent } from './app.component';
import { DispenserModule } from './dispenser/dispenser.module';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatDividerModule,
  MatToolbarModule,
  MatCheckboxModule,
  MatMenuModule,
  MatTabsModule,
  MatSliderModule,
  MatTooltipModule,
  MatIconBase,
  MatIconModule,
  MatDialogModule,
  MatListModule,
  MatProgressSpinnerModule
} from '@angular/material';
import { HeaderComponent } from './header/header.component';
import { LearnMoreComponent } from './learn-more/learn-more.component';
import { FirstPageLeftComponent } from './first-page-left/first-page-left.component';
import { FirstPageRightComponent } from './first-page-right/first-page-right.component';
import { Dispenser2Component } from './first-page-right/dispenser2/dispenser2.component';
import { DialogComponent, DialogSellComponent } from './first-page-right/dispenser2/dispenser2.component';
import { BalanceComponent } from './first-page-right/dispenser2/dispenser2.component';
import { Footer2Component } from './footer2/footer2.component';

@NgModule({
  declarations: [
    AppComponent,
    BalanceComponent,
    HeaderComponent,
    LearnMoreComponent,
    FirstPageLeftComponent,
    FirstPageRightComponent,
    Dispenser2Component,
    DialogComponent,
    DialogSellComponent,
    Footer2Component
  ],
  entryComponents: [DialogComponent, DialogSellComponent, BalanceComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
    MatToolbarModule,
    MatTabsModule,
    MatTooltipModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    HttpClientModule,
    DispenserModule,
    EmbedVideo,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
