import {Directive, HostListener, HostBinding, Output, EventEmitter} from '@angular/core';

@Directive({
  selector: '[mojDragAndDrop]'
})
export class MojDragAndDropDirective {

    @Output() fileDrop = new EventEmitter();

    @HostBinding('class.dragged') private isDragged:boolean;

    constructor() { }

    @HostListener('dragover', ['$event']) public onDragOver(event){
        event.preventDefault();
        event.stopPropagation();
        this.isDragged = true;
    }

    @HostListener('dragleave', ['$event']) public onDragLeave(event){
        event.preventDefault();
        event.stopPropagation();
        this.isDragged = false;
    }

    @HostListener('drop', ['$event']) public onDrop(event){
        event.preventDefault();
        event.stopPropagation();
        this.isDragged = false;
        const files = event.dataTransfer.files;
        this.fileDrop.emit(files);
    }

}
