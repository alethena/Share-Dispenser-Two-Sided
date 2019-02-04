import { Component, OnInit } from '@angular/core';
import { MatCheckboxModule } from '@angular/material';

@Component({
  selector: 'app-main-box',
  templateUrl: './main-box.component.html',
  styleUrls: ['./main-box.component.css']
})
export class MainBoxComponent implements OnInit {
  buyOrSell = false;

  constructor() {}

  ngOnInit() {
  }

}
