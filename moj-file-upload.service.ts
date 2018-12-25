import { HttpRequest, HttpClient, HttpEventType, HttpEvent, HttpHeaders, HttpHandler } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { MessageType } from "../../../messages/message.enum";
import { MojMessagesService } from "../../../messages/moj-messages.service";
import { MojUtilsService } from "../../../shared/utils";
import { TranslateService } from "@ngx-translate/core";
import { MojConfigService } from "../../../shared/moj-config.service";

@Injectable()
export class MojFileUploadService {
    constructor(private http: HttpHandler, private mojMessagesService: MojMessagesService, private utils: MojUtilsService, 
        private translateService: TranslateService, private mojConfigService: MojConfigService){

    }

    checkFilesBeforeUpload(addedfiles, config) {
        let msg = "";
        let canAddFiles = true;
        if (addedfiles.length === 0) {
            msg = this.translateService.instant("MojTexts.fu.fileNotExist");
            canAddFiles = false;
        }
        if (addedfiles.length > 0) {
            // if (!config.multiple && addedfiles.length > 1) {
            //     canAddFiles = false;
            //     //msg = msg + fu.getMsg(null, null, Resources.Strings.FUMustDeleteBeforeAddNewFile) + "<br><br>";
            // }
            var pattern = "\.(" + config.enabledFileTypes + ")$";
            var Reg = new RegExp(pattern);
            for (let i = 0; i < addedfiles.length; i++) {
                let file = addedfiles[i];
                if (Reg.test(file.name.toLowerCase()) === false) {
                    msg = msg + this.getMsg(file, config.enabledFileTypes) + "\n\n";
                    canAddFiles = false;
                }
                if (file.name.toLowerCase().lastIndexOf("..") >= 0) {
                    msg = msg + this.getMsg(file, null, this.utils.stringFormat(this.translateService.instant("MojTexts.fu.fileNameError"), [".."])) + "<br><br>";
                    canAddFiles = false;
                }
                if (file.name.toLowerCase().indexOf("&") >= 0) {
                    msg = msg + this.getMsg(file, null, this.utils.stringFormat(this.translateService.instant("MojTexts.fu.fileNameError"), ["&"])) + "<br><br>";
                    canAddFiles = false;
                }
                if (file.size === 0) {
                    msg = msg + this.getMsg(file, null, this.translateService.instant("MojTexts.fu.zeroSize") + "<br><br>");
                    canAddFiles = false;
                }
                if (file.size > config.maxFileSize) {
                    msg = msg + this.getMsg(file, null, this.utils.stringFormat(this.translateService.instant("MojTexts.fu.maxSize"), [config.maxFileSize / 1000000])) + "<br><br>";
                    canAddFiles = false;
                }
                //todo: למחוק את הקובץ הפגום!!!!
            }
        }
        if (msg !== "") {
            setTimeout(() => {
                this.mojMessagesService.showMessage(null, "MojTexts.errorMessage", msg, MessageType.Error).subscribe();
            });
        }
        
        return canAddFiles;
    }
    
    uploadFile(file){
        var formData = new FormData();
        var chunk = file.slice(0, file.size);
        formData.append('file', chunk);
        var data = "?fileName=" + file.name;
        const headers =  new HttpHeaders({ 'Content-Type': 'multipart/form-data' });
        //const baseUrl = "https://t.pctonline-sc.justice.gov.il/";

        const req = new HttpRequest('POST', this.mojConfigService.configuration.uploadServerUrl + data, formData, {
            reportProgress: true,
            headers: headers,
            responseType: "text"
        });
        
        return this.http.handle(req).pipe(map(event => {return {event: event, file: file}}));
    }

    getMsg(file?, fileTypes?, msg?) {
        if (msg === null || typeof (msg) === "undefined") msg = "";
        if (typeof (file) === "undefined" || file === null) file = { name: this.translateService.instant("MojTexts.fu.thisFile") };
        if (typeof (fileTypes) !== "undefined" && fileTypes !== null) {
            var types = fileTypes.split("|");
            var msgTypes = types.join(", ");
            msg = this.utils.stringFormat(this.translateService.instant("MojTexts.fu.fileTypeError"), msgTypes);
        }
        return (file.name + " " + this.translateService.instant("MojTexts.fu.cannotUploaded") + msg.replace("\n", "<br>"));
    }

    cloneFilesArray(files: any[]): any[] {
        const newFiles = files.slice(0);
        return newFiles;
    }
}


