import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainBoxComponent } from './main-box.component';

describe('MainBoxComponent', () => {
  let component: MainBoxComponent;
  let fixture: ComponentFixture<MainBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
