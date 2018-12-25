import {
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Injector
} from "@angular/core";
import { NgControl, ControlContainer } from "@angular/forms";
import { ValueAccessorBase } from "./value-accessor.base";
import { LabelAlign, LabelStyle } from "../label/label.enum";
import { BehaviorSubject, Subscription, Observable } from "rxjs";

export abstract class ElementBase<T> extends ValueAccessorBase
  implements OnInit, OnDestroy {

  @Input() controlWidthColumns: number;
  @Input() disabled: boolean;
  @Input() readOnly: boolean;
  @Input() labelTextKey: string = "";
  @Input() labelWidthColumns: number = 1;
  @Input() isLabelAutowidth: boolean = false;
  @Input() isLabelAboveControl: boolean;
  @Input() labelAlign: LabelAlign = LabelAlign.Left;
  @Input() labelStyle: LabelStyle = LabelStyle.Standard;
  @Input() customValidationErrors: any[] = [];
  @Input() formControlName: string;
  @Input() submitted: boolean = false;

  get tabIndex(): number {
    return this.disabled ? -1 : 0;
  }
  set tabIndex(newIndex: number) {
    this.tabIndex = newIndex;
  }
  public identifier: string;
  control;
  controlContainer: ControlContainer;
  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();

  groupColWidth: string;
  controlColWidth: string;

  isControlRequired: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isControlRequired$: Observable<boolean> = this.isControlRequired.asObservable();
  private subscription: Subscription;

  getGroupColWidth() {
    return this.isLabelAboveControl ? "col-sm-" + this.controlWidthColumns : "";
  }

  getControlColWidth() {
    return this.isLabelAboveControl ? "" : "col-sm-" + this.controlWidthColumns;
  }

  constructor(protected el: ElementRef, protected _injector: Injector) {
    super();
  }

  ngOnInit() {
    this.setControl();
    this.setIdentifier();
    this.groupColWidth = this.getGroupColWidth();
    this.controlColWidth = this.getControlColWidth();
    this.isControlRequired.next(this.getIsControlRequired());
    //check if require indication (*) need to change when control status checked
    this.subscription = this.control.statusChanges.subscribe(res => {
      this.isControlRequired.next(this.getIsControlRequired());
    });   
  }

  ngAfterViewInit(){
    this.setAriaDescribedby(); //accessibility - for read messages tooltip
  }

  private setIdentifier() {
    if (this.formControlName) {
      this.identifier = this.formControlName;
    }
    else {
      this.identifier = this.el.nativeElement.getAttribute("name");
    }
  }

  protected setControl() {
    //for reactive forms
    if (this.formControlName) {
      if (!this.controlContainer) {
        this.controlContainer = this._injector.get(ControlContainer);
      }
      this.control = this.controlContainer.control.get(this.formControlName);
    }
    else {
      //for template driven forms
      this.control = this._injector.get(NgControl).control;
    }
  }

  onFocusIn($event?: any) {
    this.focus.emit(event);
  }

  onBlur($event?: any) {
    this.blur.emit(event);
  }

  getIsControlRequired() {
    if (this.control.validator == null) return false;
    let validator = this.control.validator("required");
    return validator != null && validator.required;
  }

    setAriaDescribedby() {
      //set input aria-described by to error messages span
    let input;
    switch(this.el.nativeElement.nodeName){
      case "MOJ-TEXTBOX":
      case "MOJ-DATEPICKER":
      case "MOJ-CHECKBOX":
      case "MOJ-RADIOBUTTON":
      case "MOJ-MULTISELECT":
      case "MOJ-AUTOCOMPLETE":
              input = this.el.nativeElement.querySelector('input');
              break;
      case "MOJ-DROPDOWNLIST":
              input = this.el.nativeElement.querySelector('input.ui-dropdown-label'); //editable need input.ui-dropdown-label, not editable - the hidden input
              if(!input){
                input = this.el.nativeElement.querySelector('input');
              }
              break;     
      case "MOJ-TEXTAREA":
              input = this.el.nativeElement.querySelector('textarea');
              break;
    }

    if(input){
      input.setAttribute('aria-describedby', this.identifier +'-error');
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
