import { StalTab } from "./tab.class";

export interface IStalCard {
	id?: number;
	url: string;
	isMain?: boolean;
	tabId?: number;
}

export class StalCard implements IStalCard {
	id: number;
	url: string;
	isMain: boolean;
	tabId: number;

	constructor(obj: any) { //ITablerCard
		if(obj.url === undefined) {
			throw new Error('No url in obj');
		}
		this.url = obj.url;

		if(obj.tabId === undefined) {
			throw new Error('No tabId in obj');
		}
		this.tabId = obj.tabId;

		if(obj.isMain === undefined) {
			this.isMain = false;
		} else {
			this.isMain = obj.isMain;
		}

		this.id = obj.id;
	}
}
