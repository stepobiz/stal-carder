import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { filter, lastValueFrom, Observable, Subject } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';

import { IStalCard, StalCard } from '../class/card.class';
import { StalTab } from '../class/tab.class';
import { ITabTree } from '../class/tree.class';
import { OpeningType } from '../enum/opening-type.enum';

export class CardUrlIsHomeError extends Error { }

@Injectable({ providedIn: 'root' })
export class TabManagerService {
	private tabTree$ = new Subject<ITabTree>();
	private tabTree: ITabTree = {
		home: undefined,
		activeTab: undefined,
		activeCard: undefined,
		default: OpeningType.Home,
		cards: [],
		tabs: []
	};
	
	private firstLoading = true;

	private firstOpening: OpeningType = OpeningType.Tab;
	private default: OpeningType = OpeningType.Home;
	private nextOpening: OpeningType = this.firstOpening;

	private _cardActivation: StalCard | undefined = undefined;
	private _homeActivation: boolean = false;

	constructor(
		private router: Router,
		private dbService: NgxIndexedDBService,

	) { }

	async start() {
		this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(
			(event: any) => {
				this.processOpening(event.urlAfterRedirects);
			}
		);
	}


	onUpdate(): Observable< ITabTree> {
		return this.tabTree$.asObservable();
	}

	setDefault(nextOpening: OpeningType) {
		this.default = nextOpening;
	}

	openInTab() {
		this.nextOpening = OpeningType.Tab;
	}

	openInCard() {
		this.nextOpening = OpeningType.Card;
	}

	async closeTab(tab: StalTab) {
		this.updateConfig("activeTab", undefined);
		this.updateConfig("activeCard", undefined);
		
		if(this.tabTree.activeTab !== undefined && this.tabTree.activeTab.id === tab.id) {
			if(this.tabTree.home !== undefined) {
				this._homeActivation = true;
				this.router.navigateByUrl(this.tabTree.home);
			}
		}

		let tabId: any = tab.id;
		// Remove tab
		await lastValueFrom(this.dbService.bulkDelete('tab', [tabId]));

		// Clean cards
		let cards = [];
		{
			let cardsDb = await lastValueFrom(this.dbService.getAllByIndex('card', 'tabId', tabId));
			if (cardsDb !== undefined) {
				for await (const cardDb of cardsDb) {
					let card = new StalCard(cardDb);
					if (card.id === undefined) continue;
					cards.push(card.id);
				}
			}
		}
		await lastValueFrom(this.dbService.bulkDelete('card', cards));

		this.loadFromDb();
	}

	async closeCard(card: StalCard) {
		// TODO go to tabmain
		
		await lastValueFrom(this.dbService.bulkDelete('card', [card.id]));
		this.loadFromDb();
	}

	cardActivation(card: StalCard) {
		this._cardActivation = card;
	}

	tabActivation(tab: StalTab) {
		this._cardActivation = tab.mainCard;
	}

	homeActivation() {
		this.updateConfig("activeTab", undefined);
		this.updateConfig("activeCard", undefined);
		this._homeActivation = true;
	}









	private async init() {
		let _loadedConfig: string[] = [];

		let configsDb = await lastValueFrom(this.dbService.getAll('config'));
		for await (const configDb of configsDb) {
			let config: any = configDb;
			_loadedConfig.push(config['name']);
		}

		// Creale alla prima volta
		if (!_loadedConfig.includes("activeTab")) {
			await lastValueFrom(this.dbService.add('config', {
				name: "activeTab",
				value: undefined,
			}));
		}

		if (!_loadedConfig.includes("activeCard")) {
			await lastValueFrom(this.dbService.add('config', {
				name: "activeCard",
				value: undefined,
			}));
		}

		if (!_loadedConfig.includes("home")) {
			await lastValueFrom(this.dbService.add('config', {
				name: "home",
				value: undefined,
			}));
		}
	}

	private async loadFromDb() {
		let newTabTree: ITabTree = {
			activeTab: undefined,
			activeCard: undefined,
			home: undefined,
			default: this.default,
			tabs: [],
			cards: []
		};

		if(this.tabTree) {
			newTabTree.activeTab = this.tabTree.activeTab;
			newTabTree.activeCard = this.tabTree.activeCard;
			newTabTree.home = this.tabTree.home;
		}
		
		// Config
		{
			let configsDb = await lastValueFrom(this.dbService.getAll('config'));
			for await (const configDb of configsDb) {
				let config: any = configDb;
				if (config['value'] === undefined || config['value'] == "undefined") continue;
				switch (config['name']) {
					case "activeTab":
						let tabDb = await lastValueFrom(this.dbService.getByKey('tab', +config['value']));
						let tab = new StalTab(tabDb)
						newTabTree.activeTab = tab;
						break;
					case "activeCard":
						let cardDb = await lastValueFrom(this.dbService.getByKey('card', +config['value']));
						let card = new StalCard(cardDb)
						newTabTree.activeCard = card;
						break;
					case "home":
						newTabTree.home = config['value'];
						break;
				}
			}
		}

		// Tabs
		let _tabsDb: any = {};
		{
			let tabsDb = await lastValueFrom(this.dbService.getAll('tab'));
			if (tabsDb !== undefined) {
				let tabs: StalTab[] = [];
				for await (const tabDb of tabsDb) {
					let tab = new StalTab(tabDb);
					let cardDb = await lastValueFrom(this.dbService.getByIndex('card', 'tabId', +tab.id));
					let mainCard: StalCard = new StalCard(cardDb);
					mainCard.tabId = tab.id;
					tab.mainCard = mainCard;
					tabs.push(tab);
					_tabsDb[tab.id] = tab;
				}
				newTabTree.tabs = tabs;
			}
		}

		// Cards
		{
			let cardsDb = await lastValueFrom(this.dbService.getAll('card'))
			if (cardsDb !== undefined) {
				let cards: StalCard[] = [];
				for await (const cardDb of cardsDb) {
					let card = new StalCard(cardDb);
					cards.push(card)
				}
				newTabTree.cards = cards;
			}
		}
		
		this.tabTree = newTabTree;
		this.tabTree$.next(this.tabTree);
	}



	private async updateHome(url: string) {
		await this.updateConfig("activeTab", undefined);
		await this.updateConfig("activeCard", undefined);
		await this.updateConfig("home", url);

		this.loadFromDb();
	}

	private async activateCard(card: StalCard) {
		await this.updateConfig("activeTab", ""+card.tabId);
		await this.updateConfig("activeCard", ""+card.id);

		this.loadFromDb();
	}













	private async searchTab(url: string): Promise<StalTab | undefined> {
		let tabDb = await lastValueFrom(this.dbService.getByIndex('tab', 'url', url));
		if(tabDb === undefined) return undefined;
		return new StalTab(tabDb);
	}




	private async processOpening(url: string) {
		if(this.firstLoading) {
			this.firstLoading = false;
			
			await this.init();
			await this.loadFromDb();

			// Se era ultima card in uso è un reload
			if(this.tabTree.activeCard !== undefined && this.tabTree.activeCard.url == url) {
				return;
			}
			
			let loadedTab = await this.searchTab(url);
			if(loadedTab !== undefined) {
				let mainCard: StalCard = new StalCard(await lastValueFrom(this.dbService.getByIndex('card', 'tabId', +loadedTab.id)));
				mainCard.tabId = loadedTab.id;
				loadedTab.mainCard = mainCard;
				this._cardActivation = mainCard;
			}
		}

		if(this._homeActivation) {
			this._homeActivation = false;
			this.tabTree.activeTab = undefined;
			this.tabTree.activeCard = undefined;
			await this.updateConfig("activeTab", undefined);
			await this.updateConfig("activeCard", undefined);
			this.loadFromDb();
			return;
		}

		if (this._cardActivation) {
			this.activateCard(this._cardActivation);
			this._cardActivation = undefined;
			return;
		}

		let openedCard: StalCard;
		{
			let tab = (this.nextOpening == OpeningType.Card) ? this.tabTree.activeTab : undefined;
			switch (this.nextOpening) {
				case OpeningType.Card:
					// tab = this.tabTree.activeTab;  # è un fall-throuht quindi risolto con linea -3
				case OpeningType.Tab:
					try {
						let cardRequest: IStalCard = { url: url }
						openedCard = await this.newCard(cardRequest, tab);
						this.activateCard(openedCard);	
					} catch (error) { }
					break;
				default:
					this.updateHome(url);
					break;
			}
			this.nextOpening = this.default;
		}
	}

	async newCard(cardRequest: IStalCard, tabParent: StalTab | undefined = undefined): Promise<StalCard> {
		let isMain: boolean = false;
		if (tabParent === undefined) {
			// Controlla se la home ha quell'url
			if(cardRequest.url == this.tabTree.home) {
				this.homeActivation();
				this.router.navigateByUrl(this.tabTree.home);
				throw new CardUrlIsHomeError();
			}

			// Controlla se esiste già una tab con quell'url
			let loadedTab = await this.searchTab(cardRequest.url);
			if(loadedTab !== undefined) {
				let mainCard: StalCard = new StalCard(await lastValueFrom(this.dbService.getByIndex('card', 'tabId', +loadedTab.id)));
				mainCard.tabId = loadedTab.id;
				loadedTab.mainCard = mainCard;
				return mainCard;
			}

			// Crea nuova tab
			tabParent = await this.createTab(cardRequest.url);
			isMain = true;
		}

		let card: StalCard = new StalCard(await lastValueFrom(this.dbService.add('card', {
			tabId: tabParent.id,
			url: cardRequest.url,
			isMain: isMain
		})));

		card.tabId = tabParent.id;

		return card;
	}

	private async createTab(url: string) {
		if(url == this.tabTree.home) {
			throw new Error('Creation tab request url is home');
		}
		
		if(await this.searchTab(url) !== undefined) {
			throw new Error('Creation tab request url exist');
		}

		let tab: StalTab = new StalTab(await lastValueFrom(this.dbService.add('tab', {
			url: url
		})));
		return tab;
	}

	
	private async updateConfig(config: string, value: string | undefined) {
		await lastValueFrom(this.dbService.update('config', {
			name: config,
			value: value,
		}));
	}

}