import { IStalCard, StalCard } from "./card.class";

export interface IStalTab {
	id?: number;
	url: string;
	mainCard?: IStalCard;
}

export class StalTab implements IStalTab {
	id: number;
	url: string;
	mainCard?: StalCard;

	constructor(obj: any) {
		if(obj.url === undefined) {
			throw new Error('No url in obj');
		}
		this.url = obj.url;

		this.id = obj.id;
	}
}
