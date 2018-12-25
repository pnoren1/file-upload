import { Component, ChangeDetectorRef, ChangeDetectionStrategy, forwardRef, Injector, ElementRef } from '@angular/core';
import { MojFileUploadDesignType, MojBaseFileUploadComponent, FileUpload } from '../moj-file-upload.base';
import { MojFileUploadService } from '../moj-file-upload.service';
import { GFU } from "./UploadGeneration.js"
import { TranslateService } from '@ngx-translate/core';
import { MojMessagesService } from '../../../../messages/moj-messages.service';
import { HttpClient, HttpHeaders, HttpRequest, HttpHandler, HttpEventType } from '@angular/common/http';
import { isArray } from 'util';
import { map } from 'rxjs/operators';
import { MojConfigService } from '../../../../shared/moj-config.service';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ElementBase } from '../../../base/element.base';

/**
  * Usage example
  ```html
  <moj-file-upload name="docsForApprove" [labelTextKey]="'Texts.docsForApprove'" [enabledFileTypes]="'pdf|png|jpg'" [(ngModel)]="files" [isLabelAboveControl]="true" [controlWidthColumns]="4"
			[required]="isRequired1" (fileUploadComplete)="fileUploadComplete($event)"></moj-file-upload>
	<moj-file-upload name="docsForCheck" [labelTextKey]="'Texts.docsForCheck'" [enabledFileTypes]="'pdf'" [(ngModel)]="files2" [isLabelAboveControl]="true" [controlWidthColumns]="4"
			[designType]="fuDesignType.Single" [required]="isRequired2"></moj-file-upload>
  ```
  * ```typescript
  import { MojFileUploadDesignType } from "../../moj-ng/elements/website/moj-file-upload/moj-file-upload.base";
  ...
  export class FileUploadExampleComponent {
      files = [];
      files2 = [];
      fuDesignType = MojFileUploadDesignType;                                    
      fileUploadComplete(file){
          file.anyProperty = 4;
      }
  }
  *```
 */
@Component({
  selector: 'moj-file-upload',
  templateUrl: '../moj-file-upload.component.html',
  styleUrls: ['../moj-file-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MojFileUploadComponent),
    multi: true
  },
  { provide: ElementBase, useExisting: forwardRef(() => MojFileUploadComponent) }]
})
export class MojFileUploadComponent extends MojBaseFileUploadComponent {
  uploads = [];

  sendFiles(files: any[] = []) {
    this.totalSize = 0;
    this.uploadedChosenFilesSize = 0;
    this.disabled = true;
    this.showProgress = true;
    this.totalProgress = 0;
    this.errMsg = "";
    this.generalUploadStart.emit();
    this.createTickets(files);
  }

  createTickets(files) {
    this.pushFilesToUpload(files);
    var filesToSend = this.uploads;
    if (filesToSend.length > 0) {
      var params = "TestControlFiles_97";
      var registerUrl = this.mojConfigService.configuration.registerHandlerUrl + '?';

      var JSONArr = [];

      for (var i = 0; i < filesToSend.length; i++) {
        var JSONObj = {
          "oldID": filesToSend[i].fileId, "FileName": encodeURI(filesToSend[i].fileName),
          "FileSize": filesToSend[i].fileSize, "FileType": this.getFileExtension(filesToSend[i].fileName), //filesToSend[i].file.type,
          "LastModificationDate": filesToSend[i].file.lastModified
        };
        JSONArr.push(JSONObj);
      }
      var par = GFU.jSONToString(JSONArr);

      registerUrl = registerUrl + params + "&FilesToSend=" + par;
      //const headers =  new HttpHeaders({ 'Content-Type': 'multipart/form-data' });
      return this.http.get(registerUrl).subscribe(data => {
        if (isArray(data)) {
          (data as Array<any>).forEach(x => {
            this.uploads.find(y => { return y.fileId == x.OldId; }).fileGUID = x.FileID.toUpperCase();
          });
        }
        this.uploadFile();
      }, error => {
        this.generalUploadError.emit(error);
        this.handleError("Failed To Register Files in CreateTickets function");
      });
    }
  }

  pushFilesToUpload(files) {
    var file, id;
    for (var i = 0; i < files.length; i++) {
      file = files[i];
      id = this.generateTempId();
      file.TotalFilesCount = files.length;
      file.FileIndex = (i + 1);
      var upload = new FileUpload(file, id);
      this.uploads.push(upload);
      this.totalSize += file.size;
    }
  }

  uploadNextFile() {
    this.uploads.splice(0, 1); // remove first element that represents the uploaded file
    this.uploadFile();
  }

  uploadFile() {
    if (this.uploads.length > 0) // there are files to upload
    {
      if (this.uploads[0].fileGUID == null || this.uploads[0].fileGUID == '' || this.uploads[0].fileGUID == 'undefined') {
        this.handleError("Cannot upload files without GUID");
      }
      else {
        this.ajaxUpload(this.uploads[0]);
      }
    }
    else // all chosen files uploaded
    {
      if (this.designType == MojFileUploadDesignType.Single)
        this.addMoreFileEnable = false;
      this.generalUploadComplete.emit();
      this.init();
    }
  }

  ajaxUpload(upload) {
    // ChunkFile upload
    var SIZE = upload.file.size;
    var BYTES_PER_CHUNK = 1024 * 1024; // 1MB chunk sizes.
    var start = 0;
    var end = SIZE;
    var chunkNum = 0;
    var chunksQuantity = 1
    var completedChunks = 0;
    var successfulRequests = 0;
    var failedRequests = 0;

    // synchroneous upload - next chunk is sent after the current one is successfully uploaded
    this.loadChunk(start, end, upload, chunkNum,
      successfulRequests, failedRequests, completedChunks, chunksQuantity, BYTES_PER_CHUNK);
  }

  loadChunk(start, end, upload, chunkNum, successfulRequests, failedRequests, completedChunks, chunksQuantity, BYTES_PER_CHUNK) {
    var SIZE = upload.file.size;
    chunkNum++;
    var formData = new FormData();
    var chunk = upload.file.slice(start, end);

    // Append file data:
    formData.append("file", chunk);

    var uploadURL = this.mojConfigService.configuration.uploadServerUrl + "?isMultiPart=false&fileName=" + //"&action=upload&" +
      encodeURI(upload.file.name) + "&fileSize=" + SIZE + "&fid=" + upload.fileGUID + "&chunkNum=" + chunkNum + "&TotalFilesCount=" +
      upload.TotalFilesCount + "&FileIndex=" + upload.FileIndex + "&FileID=" + upload.fileGUID;


    const headers = new HttpHeaders({ 'Content-Type': 'multipart/form-data' });
    const req = new HttpRequest('POST', uploadURL, formData, {
      reportProgress: true,
      headers: headers,
      responseType: "text"
    });
    return this.httpHandler.handle(req).pipe(map(event => { return { event: event, file: upload.file } })).subscribe(
      data => {
        switch (data.event.type) {
          case HttpEventType.Sent:
            this.fileUploadStart.emit(data.file);
            break;
          case HttpEventType.UploadProgress:
            if (data.event.total == data.event.loaded) // =100, chunk upload completed
            {
              completedChunks++;
            }
            this.totalProgress = (data.event.loaded + this.uploadedChosenFilesSize) / this.totalSize * 100;
            if (this.totalProgress > 100) {
              this.totalProgress = 100;
            }
            if (data.event.loaded === data.event.total) {
              this.uploadedChosenFilesSize += data.event.total;
            }
            break;
          case HttpEventType.ResponseHeader:
            if (!data.event.ok)
              this.handleError();
            break;
          case HttpEventType.Response:
            if (this.isOK(data.event.body)) {
              successfulRequests++;
              if (successfulRequests >= chunksQuantity) {
                // file upload completed
                data.file.GUID = upload.fileGUID;
                this.uploadedChosenFilesSize += upload.fileSize;
                // add file to array
                this.addFileUploadedToFilesArray(data.file);
                this.fileUploadComplete.emit(data.file);
                this.uploadNextFile();
              }
              else {
                start = end;
                end = start + BYTES_PER_CHUNK;
                this.loadChunk(start, end, upload, chunkNum,
                  successfulRequests, failedRequests, completedChunks, chunksQuantity, BYTES_PER_CHUNK);
              }
            }
            else if (data.event.status != 0) { // xhr.status == 0 and readyState=4 is when the request is cancelled, handled in another place
              failedRequests++;
              this.handleError("Failed To Upload file" + upload.fileId + ". Server Response Status: " + data.event.status + ", Response Text=" + data.event.body);
            }
            break;
          default:
            break;
        }
      },
      error => {
        this.handleError();
        this.fileUploadError.emit(error);
      }
    );

  }

  isOK(xhrResponse) {
    var isOK = xhrResponse.indexOf("<ok") >= 0;// = $($.parseXML(xhrResponse)).find("ok").length > 0;
    return isOK;
  }

  S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  generateTempId() {
    var id = (this.S4() + this.S4()).toLowerCase();
    return id;
  }

  getFileExtension(filename) {
    var a = filename.split(".");
    if (a.length === 1 || (a[0] === "" && a.length === 2)) {
      return "";
    }
    return "." + a.pop();
  }

  constructor(protected mojUploadService: MojFileUploadService, protected mojMessagesService: MojMessagesService, protected translateService: TranslateService,
    protected cdr: ChangeDetectorRef, private http: HttpClient, private httpHandler: HttpHandler, private mojConfigService: MojConfigService, protected el: ElementRef, protected _injector: Injector) {
    super(mojUploadService, mojMessagesService, translateService, cdr, el, _injector);
  }

}
