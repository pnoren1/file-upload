import { ControlValueAccessor } from "@angular/forms";

export abstract class ValueAccessorBase implements ControlValueAccessor {
  private innerValue: any;

  propagateChange: any = () => {};
  propagateTouched: any = () => {};

  get value() {
    return this.innerValue;
  }

  set value(value) {
    this.innerValue = value;
    this.propagateChange(value);
    this.propagateTouched();
  }

  writeValue(value) {
    if (
      value !== undefined ||
      (value === undefined && this.innerValue !== undefined)
    ) {
      this.innerValue = value;
    }
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.propagateTouched = fn;
  }
}
