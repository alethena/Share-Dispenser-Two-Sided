import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstPageLeftComponent } from './first-page-left.component';

describe('FirstPageLeftComponent', () => {
  let component: FirstPageLeftComponent;
  let fixture: ComponentFixture<FirstPageLeftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirstPageLeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirstPageLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
