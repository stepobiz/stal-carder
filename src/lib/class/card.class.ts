import { StalTab } from "./tab.class";

export interface IStalCard {
	id?: number;
	url: string;
	isMain?: boolean;
	tab?: StalTab;
}

export class StalCard implements IStalCard {
	id: number;
	url: string;
	isMain: boolean;
	tab: StalTab;

	constructor(obj: any) { //ITablerCard
		if(obj.url === undefined) {
			throw new Error('No url in obj');
		}
		this.url = obj.url;

		if(obj.tab === undefined) {
			throw new Error('No tab in obj');
		}
		this.tab = obj.tab;

		if(obj.isMain === undefined) {
			this.isMain = false;
		} else {
			this.isMain = obj.isMain;
		}

		this.id = obj.id;
	}
}
