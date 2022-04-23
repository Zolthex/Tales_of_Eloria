export default class toeloriaItem extends Item {
	prepareData() {
		super.prepareData();
	}

	getRollData() {
		// If present, return the actor's roll data.
		if (!this.actor) return null;
		const rollData = this.actor.getRollData();
		rollData.item = foundry.utils.deepClone(this.data.data);

		return rollData;
	}

	// getFormula() {
	// 	const item = this.data;
	// 	if (this.type = "Skills") {
	// 		const anwendungsstufe = item.SkillUsage?.value;
	// 		let formula = `1d12 + ${anwendungsstufe}`;
	// 		return formula;
	// 	}
	// 	return null;
	// }

	async roll() {
		const item = this.data;

		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		let label = `[${item.type}] ${item.name}`;

		let content = item.data.description ?? "";

		if (!item.data.formula) {
			ChatMessage.create({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
				content,
			});
		}
		else {
			const rollData = this.getRollData();
			const roll = new Roll(rollData.item.formula, rollData)
			await roll.roll({async: true});

			label = this.enhanceRollFlavor(roll, label, item);

			roll.toMessage({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
			});
			return roll;
		}
	}

	enhanceRollFlavor(roll, label, item) {
		if (this.type === "Skills") {
			const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
			const SkillDifficult = (8 - anwendungsstufe);
			if ( roll.total > SkillDifficult ) {
				return label + ` Erfolg (diff: ${SkillDifficult})`
			} else {
				return label + ` Misserfolg (diff: ${SkillDifficult})`
			}
		}
		//if (this.type === "Attrs") {
		//	const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
		//	const SkillDifficult = (8 - anwendungsstufe);
		//	if ( roll.total > SkillDifficult ) {
		//		return label + ` Erfolg (diff: ${SkillDifficult})`
		//	} else {
		//		return label + ` Misserfolg (diff: ${SkillDifficult})`
		//	}
		//}
	}

    enhanceRollFlavor(roll, label, item) {
        if (this.type === "Skills") {
            const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
            const skillrang = item.data.SkillValue?.value ?? 0;
            const difficult = item.data.SkillDifficult?.value ?? 0;
			const actor = item.document.actor.data;
            
            let kanalisierung = 0;
            if ( this.type === "Magie" ) {
                kanalisierung = actor.data.Channeling?.Magie ?? 0;
            }
            else if ( this.type === "Faith" ) {
                kanalisierung = actor.data.Channeling?.Faith ?? 0;
            }
            else if ( this.type === "Spirit" ) {
                kanalisierung = actor.data.Channeling?.Spirit ?? 0;
            }
            
            const skilldiff = (difficult + anwendungsstufe - kanalisierung - skillrang);
            if ( roll.total > skilldiff ) {
                const manaressourcen = actor.data.ChannelResources?.Mana ?? 0;
                // Valueänderung von actor.data.ChannelResources.Mana um die größe von anwendungsstufe.
                // Wenn actor.data.ChannelResources.Mana > anwendungsstufe, dann keinen Wurf ausführen sondern:
                // Warnung das nicht genug Kosmische Kraft dazu vorhanden ist.
                return label + ` Erfolg (diff: ${skilldiff})`
            } else {
                const manaressourcen = actor.data.ChannelResources?.Mana ?? 0;
                // Valueänderung von actor.data.ChannelResources.Mana um die größe von anwendungsstufe.
                // ?? actor.data.ChannelResources.Mana = actor.data.ChannelResources.Mana - anwendungsstufe ??
                // Wenn actor.data.ChannelResources.Mana > anwendungsstufe, dann keinen Wurf ausführen sondern:
                // Warnung das nicht genug Kosmische Kraft dazu vorhanden ist.
                return label + ` Misserfolg (diff: ${skilldiff})`
            }
        }
    }
}
