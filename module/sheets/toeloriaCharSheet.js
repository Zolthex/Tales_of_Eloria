import {attributeRoll} from '../helpers/dice.js'

export default class toeloriaCharSheet extends ActorSheet {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "systems/toeloria/templates/sheets/CharSheet.hbs",
			classes: ["toeloria", "sheet", "CharSheet"],
			tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "stats" }],
		});
	}

	activateListeners(html) {
		super.activateListeners(html);
		if (this.isEditable) {
			html.find("[data-toe-roll], [data-toe-attribute]").on("click", this._rollAttributeCheck.bind(this));
			html.find("[data-toe-abroll], [data-toe-ability], [data-toe-abilattr]").on("click", this._rollAbilityCheck.bind(this));
			html.find(".rollable").on("click", this._onRoll.bind(this));
			html.find(".item-delete").on("click", (event) => this.onClickDeleteItem(event));
			html.find(".inline-edit").change(this._onSkillEdit.bind(this));
			html.find(".item-edit").click(this._onItemEdit.bind(this));
		}
	}

	async getData() {
		const character = this.actor;
		// find all owners, which are the list of all potential masters
		const owners = Object.entries(character.data.permission)
			.filter(([_id, permission]) => permission === CONST.ENTITY_PERMISSIONS.OWNER)
			.flatMap(([userID]) => game.users.get(userID) ?? []);

		// TEMPORARY solution for change in 0.8 where actor in super.getData() is an object instead of the data.
		// The correct solution is to subclass ActorSheetPF2e, but that is a more involved fix.
		const actorData = this.actor.toObject(false);
		const baseData = await super.getData();
		baseData.actor = actorData;
		baseData.data = actorData.data;
		const skills = actorData.items.filter((s) => s.type === "Skills")
		const features = actorData.items.filter((s) => s.type === "Fertigkeiten")
		const itemsthings = actorData.items.filter((s) => s.type === "Items")
		const weapons = actorData.items.filter((s) => s.type === "Waffen")
		const companions = actorData.items.filter((s) => s.type === "Companions")

		return {
			...baseData,
			owners,
			skills,
			features,
			itemsthings,
			weapons,
			companions,
		};
	}

	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
	
		// Handle rolls.
		if (dataset.rollType) {
			if (dataset.rollType === 'item') {
				const itemId = element.closest('.item').dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			//} else if (dataset.rollType === "attribute") {
			//	return attributeRoll( dataset.attribute, this.actor );  
			}
		}
	}

	async _rollAttributeCheck(event) {
		event.preventDefault();
		const { toeRoll, toeAttribute } = event.currentTarget.dataset;
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		let mod,
			flavor = "";
		if (toeAttribute) {
			console.log(this.actor.data);
			if (this.actor.data.data[toeAttribute]?.value !== undefined) {
				mod = `+${this.actor.data.data[toeAttribute].value}`;
				flavor = flavor + ` [Attribut] ${this.actor.data.data[toeAttribute]?.name}`;
			}
		}
		const roll = new Roll(toeRoll + mod);
		await roll.evaluate({ async: true });
		roll.toMessage({ 
			speaker: speaker,
			rollMode: rollMode,
			flavor 
		});
	}

	async _rollAbilityCheck(event) {
		event.preventDefault();
		const { toeAbroll, toeAbility, toeAbilattr } = event.currentTarget.dataset;
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		let mod,
			mod_2,
			flavor = "";
		if (toeAbility) {
			if (toeAbilattr) {
				console.log(this.actor.data);
				if (this.actor.data.data[toeAbility]?.value !== undefined) {
					mod = `+${this.actor.data.data[toeAbility].value}`;
					mod_2 = `+${this.actor.data.data[toeAbilattr].value}`;
					flavor = ` [Fertigkeit] ${this.actor.data.data[toeAbility]?.name}`;
				}
			}
		}
		const roll = new Roll(toeAbroll + mod + mod_2);
		await roll.evaluate({ async: true });
		roll.toMessage({ 
			speaker: speaker,
			rollMode: rollMode,
			flavor 
		});
	}
	
	async onClickDeleteItem(event) {
        const li = $(event.currentTarget).closest(".item");
        const itemId = li.attr("data-item-id") ?? "";
        const item = this.actor.items.get(itemId);

		await item.delete();
    }

	async onSkillEdit(event) {
		event.preventDefault();
		let element = event.currentTarget;
		let itemId = element.closest(".item").dataset.itemId;
		let item = this.actor.getOwnedItem(itemId);
		let field = element.dataset.field;

		return item.update({ [field]: element.value });
	}

	async onItemEdit(event) {
		event.preventDefault();
		let element = event.currentTarget;
		let itemId = element.closest(".item").dataset.itemId;
		let item = this.actor.getOwnedItem(itemId);
		
		item.sheet.render(true);
	}
}
