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

	fightCalculation(dmg) {
		console.log("Temp DMG: ", dmg);
		let actor = this.actor;		
		let hit = actor.data.data.TempDamage.value + dmg;
		console.log("Hit: ", hit);
		return actor.update({'data.TempDamage.value': hit});
	}
	
	async roll() {
		const item = this.data;
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		let label = `[${item.type}] ${item.name}`;

		let content = item.data.description ?? "";

		console.log("Label: ", item.type);

		if (!item.data.formula) {
			console.log("Step 1");
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
			let calc_date = roll._total;
			console.log("Temp DMG: ", calc_date);

			if (item.type === "Waffen") {
				console.log("Waffe");
				const dmg = item.data.WeaponDamage?.value ?? 0;
				const typ = item.data.Type?.value ?? 0;
				const ench = item.data.EnchantValue?.value ?? 0;
				const cat = item.data.Category?.value ?? 0;
				const catval = item.data.CategoryValue?.value ?? 0;
				label = `Angriff an mit ` + item.name + `(+${ench}) [${typ}] <br>Schaden: ${dmg} / ${cat}: ${catval}`;
				console.log("Waffen-Label: ", label);
				await this.fightCalculation(calc_date);				
			}
			else if (item.type === "Armor") {
				console.log("Rüstung");
				const dmg = item.data.ArmorProtection?.value ?? 0;
				const typ = item.data.Type?.value ?? 0;
				const ench = item.data.EnchantValue?.value ?? 0;
				const cat = item.data.Category?.value ?? 0;
				const catval = item.data.CategoryValue?.value ?? 0;
				label = `Verteidigt sich mit ` + item.name + `(+${ench}) [${typ}] <br>Schutz: ${dmg} / ${cat}: ${catval}`;
				console.log("Rüstungs-Label: ", label);
			}
			else {
				console.log("Gabe");
				label = this.enhanceRollFlavor(roll, label, item);
				console.log("Label: ", label);
			}

			roll.toMessage({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
			});
			let actor = this.actor;
			console.log("Temp DMG 2: ", actor.data.data.TempDamage.value);
			return roll;
		}
	}

	//enhanceRollFlavor(roll, label, item) {
	//	if (this.type === "Skills") {
	//		const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
	//		const SkillDifficult = (8 - anwendungsstufe);
	//		if ( roll.total > SkillDifficult ) {
	//			return label + ` Erfolg (diff: ${SkillDifficult})`
	//		} else {
	//			return label + ` Misserfolg (diff: ${SkillDifficult})`
	//		}
	//	}
		//if (this.type === "Attrs") {
		//	const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
		//	const SkillDifficult = (8 - anwendungsstufe);
		//	if ( roll.total > SkillDifficult ) {
		//		return label + ` Erfolg (diff: ${SkillDifficult})`
		//	} else {
		//		return label + ` Misserfolg (diff: ${SkillDifficult})`
		//	}
		//}
	//}

   
	async myManaBurn(actor, burn) {	
		console.log("burn = ", burn);
		let mana = Number(burn);
		return actor.update({'data.ChannelResources.Mana': mana});
	}

	enhanceRollFlavor(roll, label, item) {
        if (this.type === "Skills") {
            const anwendungsstufe = item.data.SkillUsage?.value ?? 0;
            const skillrang = item.data.SkillValue?.value ?? 0;
            const difficult = item.data.SkillDifficult?.value ?? 0;
			const typus = item.data.SkillTypus?.value ?? 0;
			const actor = item.document.actor.data;
			const actorsheet = this.actor;
			
			console.log("Typus = ", typus);

            let kanalisierung = 0;
            if ( typus === "Magie" ) {
                kanalisierung = actor.data.Channeling?.Magie ?? 0;
				console.log("Kanalisierung (Magie) = ", kanalisierung);
            }
            else if ( typus === "Segen" ) {
                kanalisierung = actor.data.Channeling?.Faith ?? 0;
				console.log("Kanalisierung (Glaube) = ", kanalisierung);
            }
            else if ( typus === "Askese" ) {
                kanalisierung = actor.data.Channeling?.Spirit ?? 0;
				console.log("Kanalisierung (Askese) = ", kanalisierung);
            }
			console.log(" ");
			console.log("Difficult = ", difficult);
			console.log("Anwendungsstufe = ", anwendungsstufe);
			console.log("Kanalisierung = ", kanalisierung);
			console.log("Skillrang = ", skillrang);            
			let skilldiff = (Number(difficult) + Number(anwendungsstufe) - Number(kanalisierung) - Number(skillrang));
			console.log(" ");
			console.log("Skill-Difficult (math) = ",skilldiff);
			if ( skilldiff > 12 ) { skilldiff = Number(12);}
			console.log("Skill-Difficult (ready) = ",skilldiff);

            if ( roll.total >= skilldiff ) {
                const manaressourcen = actor.data.ChannelResources?.Mana ?? 0;				
				if ( anwendungsstufe > manaressourcen ) {
					let manaburn = 0;
					console.log("manaburn = ", manaburn);
					this.myManaBurn(actor, manaburn);
					actorsheet.sheet.render(true);
					this.myManaBurn(actor, manaburn);
					return label + ` Misserfolg weil zu wenig Mana (diff: ${skilldiff})`
				}
				else {
					let manaburn = Number(manaressourcen) - Number(anwendungsstufe);
					console.log("manaburn = ", manaburn);
					this.myManaBurn(actor, manaburn);
					actorsheet.sheet.render(true);
					this.myManaBurn(actor, manaburn);
					return label + ` Erfolg (diff: ${skilldiff})`
				}
                // Valueänderung von actor.data.ChannelResources.Mana um die größe von anwendungsstufe.
                // Wenn actor.data.ChannelResources.Mana > anwendungsstufe, dann keinen Wurf ausführen sondern:
                // Warnung das nicht genug Kosmische Kraft dazu vorhanden ist.
                
            } else {
                const manaressourcen = actor.data.ChannelResources?.Mana ?? 0;
                // Valueänderung von actor.data.ChannelResources.Mana um die größe von anwendungsstufe.
                // ?? actor.data.ChannelResources.Mana = actor.data.ChannelResources.Mana - anwendungsstufe ??
                // Wenn actor.data.ChannelResources.Mana > anwendungsstufe, dann keinen Wurf ausführen sondern:
                // Warnung das nicht genug Kosmische Kraft dazu vorhanden ist.
				
				if ( anwendungsstufe > manaressourcen ) {
					let manaburn = 0;
					console.log("manaburn = ", manaburn);
					this.myManaBurn(actor, manaburn);
					actorsheet.sheet.render(true);
					this.myManaBurn(actor, manaburn);
					return label + ` Misserfolg und zu wenig Mana (diff: ${skilldiff})`
				}
				else {
					let manaburn = Number(manaressourcen) - Number(anwendungsstufe);
					console.log("manaburn = ", manaburn);
					this.myManaBurn(actor, manaburn);
					actorsheet.sheet.render(true);
					this.myManaBurn(actor, manaburn);
					return label + ` Misserfolg (diff: ${skilldiff})`
				}
            }
        }
    }
}
