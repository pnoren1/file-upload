import { Component, OnInit } from "@angular/core";
import { MojFileUploadDesignType } from "../../moj-ng/elements/website/moj-file-upload/moj-file-upload.base";
import { ColDef, GridOptions } from "ag-grid-community";
import { EditOptions } from "../../moj-ng/elements/grid/edit-component/edit-options.model";
import { EditServiceBase } from "../../moj-ng/elements/grid/service/edit-service.base";
import { GridService } from "../../moj-ng/elements/grid/service/moj-grid.service";
import { NewFileComponent } from "./new-file.component";

@Component({
    selector: "file-upload-example",
    templateUrl: "file-upload-example.component.html"
})
export class FileUploadExampleComponent {

    // files = [{name: "file1.pdf", GUID: "0c496f04-4030-4b13-8ba8-dc8a615bd4cf", docType: 3}, {name: "file2.pdf", GUID: "0cec6cf0-0bb0-4e3e-ba29-d34c3d1fa233", docType: 2}, {name: "file3.pdf", GUID: "1bf5010d-f6f5-4bd2-9cbb-7a34d1cab0ab", docType: 3}];
    files: any;

    files2;

    fuDesignType = MojFileUploadDesignType;
                                            
    fileUploadComplete(file){
        file.docType = 4;
    }

    isRequired1: boolean = false;
    isRequired2: boolean = false;

    constructor() {
    }
    
}