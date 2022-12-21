import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';

import { TabManagerService } from './services/tab-manager.service';
import { TablerTabsListComponent } from './components/tab-list/tabs-list.component';
import { IsChildPipe } from './pipes/is-child.pipe';



const dbConfig: DBConfig = {
    name: 'stal-carder',
    version: 1,
    objectStoresMeta: [
        {
            store: 'tab',
            storeConfig: { keyPath: 'id', autoIncrement: true },
            storeSchema: [
                { name: 'url', keypath: 'url', options: { unique: false } },
            ]
        },
        {
            store: 'card',
            storeConfig: { keyPath: 'id', autoIncrement: true },
            storeSchema: [
                { name: 'url', keypath: 'url', options: { unique: false } },
                { name: 'isMain', keypath: 'isMain', options: { unique: false } },
            ]
        },
        {
            store: 'config',
            storeConfig: { keyPath: 'name', autoIncrement: false },
            storeSchema: [
                { name: 'value', keypath: 'value', options: { unique: false } },
            ]
        },
    ],
    migrationFactory() {
        return {
            1: (db: any, transaction: any) => {
                transaction.objectStore('card').createIndex('tabId', 'tabId', { unique: false });
                transaction.objectStore('tab').createIndex('url', 'url', { unique: false });
                transaction.objectStore('config').createIndex('name', 'name', { unique: true });
            }
        };
    },
};

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NgxIndexedDBModule.forRoot(dbConfig),

    ],
    providers: [
        TabManagerService,

    ],
    declarations: [
        TablerTabsListComponent,

        IsChildPipe,

    ],
    exports: [
        TablerTabsListComponent,

    ],
})
export class StalCarderModule { }
