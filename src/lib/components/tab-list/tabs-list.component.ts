import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TabManagerService } from '../../services/tab-manager.service';

@Component({
    selector: 'stal-tabs',
    templateUrl: 'tabs-list.component.html',
    styleUrls: ['tabs-list.component.scss']

})

export class TablerTabsListComponent implements OnDestroy {
    
    tabManagerSubscription: Subscription;

    tabler: any;

    constructor(
        public tabManagerService: TabManagerService,
    ) {
        this.tabManagerSubscription = this.tabManagerService.onUpdate().subscribe(
            (tabler) => this.tabler = tabler
        )
    }

    ngOnDestroy() {
        if (this.tabManagerSubscription) {
            this.tabManagerSubscription.unsubscribe();
        }
    }
}