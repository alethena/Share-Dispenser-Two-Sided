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
import { FooterComponent } from './footer/footer.component';
import { MainBoxComponent } from './main-box/main-box.component';
import { LearnMoreComponent } from './learn-more/learn-more.component';
import { FirstPageLeftComponent } from './first-page-left/first-page-left.component';
import { FirstPageRightComponent } from './first-page-right/first-page-right.component';
import { DispenserComponent } from './first-page-right/dispenser/dispenser.component';
import { Dispenser2Component } from './first-page-right/dispenser2/dispenser2.component';
import { DialogComponent } from './first-page-right/dispenser2/dispenser2.component';
import { Footer2Component } from './footer2/footer2.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MainBoxComponent,
    LearnMoreComponent,
    FirstPageLeftComponent,
    FirstPageRightComponent,
    DispenserComponent,
    Dispenser2Component,
    DialogComponent,
    Footer2Component
  ],
  entryComponents: [DialogComponent],
  imports: [
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
    BrowserModule,
    FormsModule,
    HttpClientModule,
    EmbedVideo.forRoot(),
    DispenserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
