import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { CountryService } from './demo/service/country.service';
import { EventService } from './demo/service/event.service';
import { IconService } from './demo/service/icon.service';
import { NodeService } from './demo/service/node.service';
import { LoginService } from './demo/service/login.service';
import { RegisterService } from './demo/service/register.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DashboardService } from './demo/service/dashboard.service';

@NgModule({
    declarations: [AppComponent,],
    imports: [AppRoutingModule, AppLayoutModule, ToastModule],
    providers: [
        { provide: LocationStrategy, useClass: PathLocationStrategy },
        CountryService,
        EventService, 
        IconService, 
        NodeService,
        LoginService,
        MessageService,
        DashboardService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
