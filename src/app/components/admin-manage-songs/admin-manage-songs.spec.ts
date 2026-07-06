import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageSongs } from './admin-manage-songs';

describe('AdminManageSongs', () => {
  let component: AdminManageSongs;
  let fixture: ComponentFixture<AdminManageSongs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageSongs],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminManageSongs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
