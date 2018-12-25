import { Input, Output, EventEmitter, ChangeDetectorRef, Injector, ElementRef } from "@angular/core";
import { DialogResultEnum, MessageType } from "../../../messages/message.enum";
import { MojFileUploadService } from "./moj-file-upload.service";
import { MojMessagesService } from "../../../messages/moj-messages.service";
import { TranslateService } from "@ngx-translate/core";
import { ElementBase } from "../../base/element.base";
import { isArray } from "util";

export enum MojFileUploadDesignType {
    List = 0,
    Single = 1
}

export class FileUpload {
    constructor(private file, private id) {}
    //object from tehila - must
    TotalFilesCount = this.file.TotalFilesCount;
    FileIndex = this.file.FileIndex;
    fileId = this.id
    fileGUID = null;
    fileName = this.file.name;
    fileSize = this.file.size;
    uploadSize = this.file.size;
    isValid = true;
    uploadedBytes = 0;
}

export class MojBaseFileUploadComponent extends ElementBase<any> {
    @Input() enabledFileTypes: string = "*";
    @Input() tooltipTextKey: string = "browse";
    @Input() multiple: boolean = true;
    @Input() maxFileSize: number = 104857600;
    @Input() designType: MojFileUploadDesignType = MojFileUploadDesignType.List;
    @Input() showFileList: boolean = true;
    @Input() sendFilesOnUpload: boolean = true;

    get manipulateFileTyps() {
        return "." + this.enabledFileTypes.toLowerCase().replace(/\|/g, ",.");
    }

    @Output() generalUploadStart: EventEmitter<any> = new EventEmitter();
    @Output() generalUploadComplete: EventEmitter<any> = new EventEmitter();
    @Output() generalUploadError: EventEmitter<any> = new EventEmitter();
    @Output() fileUploadStart: EventEmitter<any> = new EventEmitter();
    @Output() fileUploadComplete: EventEmitter<any> = new EventEmitter();
    @Output() fileUploadError: EventEmitter<any> = new EventEmitter();
    @Output() fileUploadDelete: EventEmitter<any> = new EventEmitter();
    
    totalProgress: number = 50;
    showProgress: boolean;
    errMsg: string;
    addMoreFileEnable: boolean = true;

    totalSize: number = 0;
    uploadedChosenFilesSize: number = 0;

    fileChange(event) {
        if(event.target.files && event.target.files.length > 0) {
            var addedfiles = event.target.files;
            this.checkAndUpload(addedfiles);
        }
    }

    checkAndUpload(addedfiles) {
        var config = {
            enabledFileTypes: this.enabledFileTypes,
            multiple: this.multiple,
            maxFileSize: this.maxFileSize
        }
        let canAddFiles = this.mojUploadService.checkFilesBeforeUpload(addedfiles, config);
        if(canAddFiles){
            if (this.sendFilesOnUpload) {
                this.sendFiles(addedfiles);
            }
            else{
                this.value = addedfiles;
            }
        }
    }

    sendFiles(files: any[] = []) {
        
    }

    init() {
        setTimeout(x => { 
            this.showProgress = false;
            this.disabled = false;
            this.cdr.detectChanges();
        }, 1000);
    }

    handleError(msg?: string) {
        this.errMsg = this.translateService.instant("MojTexts.fu.fileUploadError");
        if(msg != undefined)
            this.errMsg = msg;
        this.init();
    }

    addFileUploadedToFilesArray(file: any){
        let files = this.value;
        if(files === undefined || files === null) files = [];
        if(this.designType == MojFileUploadDesignType.Single)
          files[0] = file;
        else
          files.push(file);
        this.value = this.mojUploadService.cloneFilesArray(files);
    }

    deleteFile(file: any) {
        this.mojMessagesService.confirm("MojTexts.fu.confirmFileDelete", "MojTexts.alertMessage", null).subscribe((result) => {
            if(result.dialogResultType == DialogResultEnum.OK)
            {
                let files = this.value;
                if(this.designType == MojFileUploadDesignType.Single) {
                    files = [];
                    this.addMoreFileEnable = true;
                }
                else {
                    files.splice(files.indexOf(file), 1);
                }
                this.value = this.mojUploadService.cloneFilesArray(files);
                this.fileUploadDelete.emit(file);
                this.cdr.detectChanges();
            }
        });
    }
    
    onDrop(files){
        if(files.length > 0) {
            if(this.designType == MojFileUploadDesignType.Single && files.length > 1)
                this.mojMessagesService.showMessage(this.translateService.instant("MojTexts.fu.noMultiDraggable"), "MojTexts.errorMessage", null, MessageType.Error);
            else
                this.checkAndUpload(files);
        }
    }

    constructor(protected mojUploadService: MojFileUploadService, protected mojMessagesService: MojMessagesService, 
        protected translateService: TranslateService, protected cdr: ChangeDetectorRef, protected el: ElementRef, protected _injector: Injector) {
            super(el, _injector);
    }

    ngOnInit() {
        super.ngOnInit();
        if(this.value && !isArray(this.value))
            throw("[(ngModel)] for moj-file-upload must be an array type variable");
        if(this.designType == MojFileUploadDesignType.Single)
            this.multiple = false;
    }
    
}