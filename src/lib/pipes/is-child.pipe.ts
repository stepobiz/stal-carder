import { PipeTransform, Pipe } from '@angular/core';
import { StalCard } from '../class/card.class';
import { StalTab } from '../class/tab.class';

@Pipe({
	name: 'isChild',
	pure: false
})
export class IsChildPipe implements PipeTransform {
	transform(cards: StalCard[], tab: StalTab) {
		if (!cards || !tab) {
			return [];
		}
		let filteredCards: StalCard[] = [];
		for (let card of cards) {
			if(card.tab !== undefined && card.tab.id == tab.id) {
				filteredCards.push(card);
			}
		}
		return filteredCards;
	}
}