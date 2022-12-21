import { OpeningType } from "../enum/opening-type.enum";
import { StalCard } from "./card.class";
import { StalTab } from "./tab.class";

export interface ITabTree {
	home: string | undefined,
	activeTab: StalTab | undefined,
	activeCard: StalCard | undefined,
	default: OpeningType,
	cards: StalCard[]
	tabs: StalTab[],
}