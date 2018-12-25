import { NgModule } from "@angular/core";
import { MojNewFileUploadComponent } from "./version-4/moj-file-upload.component" 
import { MojFileUploadService } from "./moj-file-upload.service";
import { TranslateModule } from "@ngx-translate/core";
import { CommonModule } from "@angular/common";
import { MojFileUploadComponent } from './version-3/moj-file-upload.component';
import { MojDirectiveModule } from "../../../directives/moj-directive.module";
import { MojInputModule } from "../../input.module";
import { MojSharedModule } from "../../../../moj-ng/shared/moj.shared.module";

@NgModule({
    imports: [CommonModule, TranslateModule, MojSharedModule, MojDirectiveModule, MojInputModule],
    exports: [MojNewFileUploadComponent, MojFileUploadComponent],
    declarations: [MojNewFileUploadComponent, MojFileUploadComponent],
    providers: [MojFileUploadService]
})
export class MojFileUploadModule {
}