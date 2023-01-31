// used in primary calc
function CALCULATE_ALL_MOVES_MODERN(p1, p2, field) {
	checkAirLock(p1, field);
	checkAirLock(p2, field);
	checkForecast(p1, field.getWeather());
	checkForecast(p2, field.getWeather());
	checkKlutz(p1);
	checkKlutz(p2);
	checkEvo(p1, p2);
	checkMinimize(p1, p2);
	checkSeeds(p1, field.getTerrain());
	checkSeeds(p2, field.getTerrain());
	checkAngerShell(p1);
	checkAngerShell(p2);
	p1.stats[DF] = getModifiedStat(p1.rawStats[DF], p1.boosts[DF]);
	p1.stats[SD] = getModifiedStat(p1.rawStats[SD], p1.boosts[SD]);
	p1.stats[SP] = getFinalSpeed(p1, field.getWeather(), field.getTerrain());
	p2.stats[DF] = getModifiedStat(p2.rawStats[DF], p2.boosts[DF]);
	p2.stats[SD] = getModifiedStat(p2.rawStats[SD], p2.boosts[SD]);
	p2.stats[SP] = getFinalSpeed(p2, field.getWeather(), field.getTerrain());
	checkIntimidate(p1, p2);
	checkIntimidate(p2, p1);
	//checkDownload(p1, p2);
	//checkDownload(p2, p1);
	checkZacianZamazaenta(p1);
	checkZacianZamazaenta(p2);
	p1.stats[AT] = getModifiedStat(p1.rawStats[AT], p1.boosts[AT]);
	p1.stats[SA] = getModifiedStat(p1.rawStats[SA], p1.boosts[SA]);
	p2.stats[AT] = getModifiedStat(p2.rawStats[AT], p2.boosts[AT]);
	p2.stats[SA] = getModifiedStat(p2.rawStats[SA], p2.boosts[SA]);
	var side1 = field.getSide(1);
	var side2 = field.getSide(0);
	var results = [[], []];
	for (var i = 0; i < 4; i++) {
		results[0][i] = getDamageResult(p1, p2, p1.moves[i], side1);
		results[1][i] = getDamageResult(p2, p1, p2.moves[i], side2);
	}
	return results;
}

// used in mass calc
function CALCULATE_MOVES_OF_ATTACKER_MODERN(attacker, defender, field) {
	checkAirLock(attacker, field);
	checkAirLock(defender, field);
	checkForecast(attacker, field.getWeather());
	checkForecast(defender, field.getWeather());
	checkKlutz(attacker);
	checkKlutz(defender);
	checkEvo(attacker, defender);
	//checkMinimize() appears to be intentionally removed
	checkSeedsHonk(attacker, field.getTerrain());
	checkSeedsHonk(defender, field.getTerrain());
	checkAngerShell(attacker);
	checkAngerShell(defender);
	attacker.stats[SP] = getFinalSpeed(attacker, field.getWeather(), field.getTerrain());
	defender.stats[DF] = getModifiedStat(defender.rawStats[DF], defender.boosts[DF]);
	defender.stats[SD] = getModifiedStat(defender.rawStats[SD], defender.boosts[SD]);
	defender.stats[SP] = getFinalSpeed(defender, field.getWeather(), field.getTerrain());
	checkIntimidate(attacker, defender);
	checkIntimidate(defender, attacker);
	checkDownload(attacker, defender);
	checkZacianZamazaenta(attacker);
	checkZacianZamazaenta(defender);
	attacker.stats[AT] = getModifiedStat(attacker.rawStats[AT], attacker.boosts[AT]);
	attacker.stats[SA] = getModifiedStat(attacker.rawStats[SA], attacker.boosts[SA]);
	defender.stats[AT] = getModifiedStat(defender.rawStats[AT], defender.boosts[AT]);
	var defenderSide = field.getSide(~~(mode === "one-vs-all"));
	var results = [];
	for (var i = 0; i < 4; i++) {
		results[i] = getDamageResult(attacker, defender, attacker.moves[i], defenderSide);
	}
	return results;
}

function getDamageResult(attacker, defender, move, field) {
	var moveDescName = move.name;
	if (move.isZ) {
		if (move.name === "Nature Power") {
			move.zp = field.terrain === "Electric" || field.terrain === "Grassy" || field.terrain === "Psychic" || field.terrain === "Misty" ? 175 : 160;
			move.type = field.terrain === "Electric" ? "Electric" : field.terrain === "Grassy" ? "Grass" : field.terrain === "Misty" ? "Fairy" : move.type = field.terrain === "Psychic" ? "Psychic" : "Normal";
		}
	}

	var attackerItem = attacker.item;
	if (move.isMax) {
		moveDescName = move.name + " (" + move.bp + " BP)";
		if (attackerItem == "Choice Band" || attackerItem == "Choice Specs" || attackerItem == "Choice Scarf") {
			attackerItem = "";
		}
	}
	var description = {
		"attackerName": attacker.name,
		"moveName": moveDescName,
		"defenderName": defender.name,
		"isDynamax": defender.isDynamax
	};
	predictShellSideArm(attacker, defender, move);
	if (attacker.ability === "Long Reach" || attackerItem === "Punching Glove") {
		move.makesContact = false;
	}
	if (defender.isTerastal) {
		description.defenderTera = defender.type1;
	}
	if (move.bp === 0) {
		return {"damage": [0], "description": buildDescription(description)};
	}

	var defAbility = defender.ability;
	if (["Mold Breaker", "Teravolt", "Turboblaze"].indexOf(attacker.ability) !== -1 && defAbility !== "Shadow Shield") {
		description.attackerAbility = attacker.ability;
		if (defender.item === "Ability Shield") {
			description.defenderItem = defender.item;
		} else {
			defAbility = "";
		}
	} else if (["Moongeist Beam", "Sunsteel Strike", "Searing Sunraze Smash", "Menacing Moonraze Maelstrom", "Light That Burns the Sky", "G-Max Drum Solo", "G-Max Hydrosnipe", "G-Max Fireball"].includes(move.name) && defAbility !== "Shadow Shield") {
		if (defender.item === "Ability Shield") {
			description.defenderItem = defender.item;
		} else {
			defAbility = "";
		}
	}

	var isCritical = move.isCrit && ["Battle Armor", "Shell Armor"].indexOf(defAbility) === -1;

	switch (move.name) {
	case "Weather Ball":
		move.type = field.weather.indexOf("Sun") > -1 ? "Fire" :
			field.weather.indexOf("Rain") > -1 ? "Water" :
				field.weather === "Sand" ? "Rock" :
					(field.weather === "Hail" || field.weather === "Snow") ? "Ice" :
						"Normal";
		description.weather = field.weather;
		description.moveType = move.type;
		break;

	case "Terrain Pulse":
		move.type = field.terrain === "Electric" ? "Electric" : field.terrain === "Grassy" ? "Grass" : field.terrain === "Misty" ? "Fairy" : move.type = field.terrain === "Psychic" ? "Psychic" : "Normal";
		break;

	case "Judgment":
		if (attackerItem.indexOf("Plate") !== -1) {
			move.type = getItemBoostType(attackerItem);
		}
		break;

	case "Multi-Attack":
		if (attackerItem.indexOf("Memory") !== -1) {
			move.type = getMultiAttack(attackerItem);
		}
		break;

	case "Techno Blast":
		if (attackerItem.indexOf("Drive") !== -1) {
			move.type = getTechnoBlast(attackerItem);
		}
		break;

	case "Natural Gift":
		if (attackerItem.indexOf("Berry") !== -1) {
			var gift = getNaturalGift(attackerItem);
			move.type = gift.t;
			move.bp = gift.p;
			description.attackerItem = attackerItem;
			description.moveBP = move.bp;
			description.moveType = move.type;
		}
		break;

	case "Nature Power":
		move.type = field.terrain === "Electric" ? "Electric" : field.terrain === "Grassy" ? "Grass" : field.terrain === "Misty" ? "Fairy" : move.type = field.terrain === "Psychic" ? "Psychic" : "Normal";
		break;

	case "Revelation Dance":
		move.type = attacker.type1; // always just takes on the first type, even in tera
		break;

	case "Meteor Beam":
		attacker.boosts[SA] = attacker.ability === "Simple" ? Math.min(6, attacker.boosts[SA] + 2) : (attacker.ability === "Contrary" ? Math.max(-6, attacker.boosts[SA] - 1) : Math.min(6, attacker.boosts[SA] + 1));
		attacker.stats[SA] = getModifiedStat(attacker.rawStats[SA], attacker.boosts[SA]);
		// this boost gets reset after attack mods are calc'd
		break;

	case "Tera Blast":
		if (attacker.isTerastal) move.type = attacker.type1;
		break;

	case "Raging Bull":
		move.type = attacker.name === "Tauros-Paldea" ? "Fighting" : attacker.name === "Tauros-Paldea-Aqua" ? "Water" : attacker.name === "Tauros-Paldea-Blaze" ? "Fire" : "Normal";
		break;
	}

	var isAerilate = attacker.ability === "Aerilate" && move.type === "Normal" && move.name !== "Revelation Dance" && !(move.name === "Tera Blast" && attacker.isTerastal); // Raging Bull could be here
	var isPixilate = attacker.ability === "Pixilate" && move.type === "Normal" && move.name !== "Revelation Dance" && !(move.name === "Tera Blast" && attacker.isTerastal);
	var isRefrigerate = attacker.ability === "Refrigerate" && move.type === "Normal" && move.name !== "Revelation Dance" && !(move.name === "Tera Blast" && attacker.isTerastal);
	var isGalvanize = attacker.ability === "Galvanize" && move.type === "Normal" && move.name !== "Revelation Dance" && !(move.name === "Tera Blast" && attacker.isTerastal);
	var isNormalize = attacker.ability === "Normalize" && (["Hidden Power", "Weather Ball", "Natural Gift", "Judgment", "Techno Blast", "Revelation Dance", "Multi-Attack", "Terrain Pulse"].indexOf(move.name) === -1) && !move.isZ && !(move.name === "Tera Blast" && attacker.isTerastal);
	if (!move.isZ) { //Z-Moves don't receive -ate type changes
		if (isAerilate) {
			move.type = "Flying";
		} else if (isPixilate) {
			move.type = "Fairy";
		} else if (isRefrigerate) {
			move.type = "Ice";
		} else if (isGalvanize) {
			move.type = "Electric";
		} else if (isNormalize) {
			move.type = "Normal";
			description.attackerAbility = attacker.ability;
		} else if (attacker.ability === "Liquid Voice" && move.isSound) {
			move.type = "Water";
			description.attackerAbility = attacker.ability;
		}
	}

	if ((attacker.ability === "Gale Wings" && move.type === "Flying") ||
		(move.name === "Grassy Glide" && field.terrain === "Grassy" && isGrounded(attacker, field.isGravity, attacker.ability === "Levitate"))) {
		move.hasPriority = true;
	}
	var attackerWeight = attacker.weight;
	var defenderWeight = defender.weight;
	if (attacker.ability === "Heavy Metal") {
		attackerWeight *= 2;
	} else if (attacker.ability === "Light Metal") {
		attackerWeight = Math.floor(attackerWeight * 5) / 10;
	}
	if (defender.ability === "Heavy Metal") {
		defenderWeight *= 2;
	} else if (defender.ability === "Light Metal") {
		defenderWeight = Math.floor(defenderWeight * 5) / 10;
	}

	var typeEffect1 = getMoveEffectiveness(move, defender.type1, attacker.ability === "Scrappy", field.isGravity);
	var typeEffect2 = defender.type2 ? getMoveEffectiveness(move, defender.type2, attacker.ability === "Scrappy", field.isGravity) : 1;
	var typeEffectiveness = typeEffect1 * typeEffect2;

	if (typeEffectiveness === 0 && move.name === "Thousand Arrows") {
		typeEffectiveness = 1;
	}
	if (defender.item === "Ring Target" && typeEffectiveness === 0) {
		if (typeChart[move.type][defender.type1] === 0) {
			typeEffectiveness = typeEffect2;
		} else if (typeChart[move.type][defender.type2] === 0) {
			typeEffectiveness = typeEffect1;
		}
	}

	if (typeEffectiveness === 0) {
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (defAbility === "Wonder Guard" && typeEffectiveness <= 1 ||
            move.type === "Grass" && defAbility === "Sap Sipper" ||
            move.type === "Fire" && ["Flash Fire", "Flash Fire (activated)", "Well-Baked Body"].indexOf(defAbility) !== -1 ||
            move.type === "Water" && ["Dry Skin", "Storm Drain", "Water Absorb"].indexOf(defAbility) !== -1 ||
            move.type === "Electric" && ["Lightning Rod", "Lightningrod", "Motor Drive", "Volt Absorb"].indexOf(defAbility) !== -1 ||
            move.type === "Ground" && move.name !== "Thousand Arrows" && defAbility === "Levitate" && !isGrounded(defender, field.isGravity, true) ||
            move.type === "Ground" && defAbility === "Earth Eater" ||
            move.isBullet && defAbility === "Bulletproof" ||
            move.isSound && defAbility === "Soundproof" ||
            move.isWind && defAbility === "Wind Rider") {
		description.defenderAbility = defAbility;
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (move.type === "Ground" && move.name !== "Thousand Arrows" && defender.item === "Air Balloon" && !isGrounded(defender, field.isGravity, defAbility === "Levitate")) {
		description.defenderItem = defender.item;
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (field.weather === "Harsh Sun" && move.type === "Water" || field.weather === "Heavy Rain" && move.type === "Fire") {
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (move.name === "Sky Drop" &&
        ([defender.type1, defender.type2].indexOf("Flying") !== -1 ||
            defenderWeight >= 200.0 || field.isGravity)) {
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (move.name === "Synchronoise" &&
            [defender.type1, defender.type2].indexOf(attacker.type1) === -1 && [defender.type1, defender.type2].indexOf(attacker.type2) === -1) {
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (move.name === "Steel Roller" && !field.terrain) {
		return {"damage": [0], "description": buildDescription(description)};
	}
	if (move.hasPriority) {
		if (field.terrain === "Psychic" && isGrounded(defender, field.isGravity, defAbility === "Levitate")) {
			description.terrain = field.terrain;
			return {"damage": [0], "description": buildDescription(description)};
		} else if (["Dazzling", "Queenly Majesty", "Armor Tail"].includes(defAbility)) {
			description.defenderAbility = defAbility;
			return {"damage": [0], "description": buildDescription(description)};
		}
	}
	let bypassProtect = ["Doom Desire", "Feint", "Future Sight", "Hyperspace Fury", "Hyperspace Hole", "Phantom Force", "Shadow Force", "Hyper Drill"].includes(move.name) || (attacker.ability === "Unseen Fist" && move.makesContact);
	if (field.isProtect && !move.isZ && !move.isMax && !bypassProtect) {
		description.defenderAbility = "Protecting";
		return {"damage": [0], "description": buildDescription(description)};
	}

	description.HPEVs = defender.HPEVs + " HP";

	if (["Seismic Toss", "Night Shade"].indexOf(move.name) !== -1) {
		var lv = attacker.level;
		if (attacker.ability === "Parental Bond") {
			lv *= 2;
		}
		return {"damage": [lv], "description": buildDescription(description)};
	}

	  if (move.name === "Final Gambit") {
		  return {"damage": [attacker.curHP]};
	}

	if (move.hits > 1) {
		description.hits = move.hits;
	}
	var turnOrder = attacker.stats[SP] > defender.stats[SP] ? "FIRST" : "LAST";

	////////////////////////////////
	////////// BASE POWER //////////
	////////////////////////////////
	var basePower;
	switch (move.name) {
	case "Payback":
		basePower = turnOrder === "LAST" ? 100 : 50;
		description.moveBP = basePower;
		break;
	case "Electro Ball":
		var r = Math.floor(attacker.stats[SP] / defender.stats[SP]);
		basePower = r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : 60;
		description.moveBP = basePower;
		break;
	case "Gyro Ball":
		basePower = attacker.stats[SP] === 0 ? 1 : Math.min(150, Math.floor(25 * defender.stats[SP] / attacker.stats[SP]) + 1);
		description.moveBP = basePower;
		break;
	case "Punishment":
		basePower = Math.min(200, 60 + 20 * countBoosts(defender.boosts));
		description.moveBP = basePower;
		break;
	case "Low Kick":
	case "Grass Knot":
		var w = defenderWeight;
		basePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
		description.moveBP = basePower;
		break;
	case "Crush Grip":
 	case "Wring Out":
    		basePower = 100 * Math.floor((defender.curHP * 4096) / defender.maxHP);
    		basePower = Math.floor(Math.floor((120 * basePower + 2048 - 1) / 4096) / 100) || 1;
    		description.moveBP = basePower;
    		break;
	case "Hex":
	case "Infernal Parade":
		basePower = move.bp * (defender.status !== "Healthy" ? 2 : 1);
		description.moveBP = basePower;
		break;
	case "Heavy Slam":
	case "Heat Crash":
		var wr = attackerWeight / defenderWeight;
		basePower = wr >= 5 ? 120 : wr >= 4 ? 100 : wr >= 3 ? 80 : wr >= 2 ? 60 : 40;
		description.moveBP = basePower;
		break;
	case "Stored Power":
	case "Power Trip":
		basePower = 20 + 20 * countBoosts(attacker.boosts);
		description.moveBP = basePower;
		break;
	case "Acrobatics":
		basePower = attackerItem === "Flying Gem" || attacker.item === "" ? 110 : 55;
		description.moveBP = basePower;
		break;
	case "Wake-Up Slap":
		basePower = move.bp * (defender.status === "Asleep" ? 2 : 1);
		description.moveBP = basePower;
		break;
	case "Weather Ball":
		basePower = field.weather !== "" ? 100 : 50;
		description.moveBP = basePower;
		break;
	case "Terrain Pulse":
		basePower = field.terrain !== "" ? 100 : 50;
		description.moveBP = basePower;
		break;
	case "Fling":
		basePower = getFlingPower(attackerItem);
		description.moveBP = basePower;
		description.attackerItem = attackerItem;
		break;
	case "Eruption":
	case "Dragon Energy":
	case "Water Spout":
		basePower = Math.max(1, Math.floor(150 * attacker.curHP / attacker.maxHP));
		description.moveBP = basePower;
		break;
	case "Flail":
	case "Reversal":
		var p = Math.floor(48 * attacker.curHP / attacker.maxHP);
		basePower = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
		description.moveBP = basePower;
		break;
	case "Nature Power":
		basePower = field.terrain === "Electric" || field.terrain === "Grassy" || field.terrain === "Psychic" ? 90 : field.terrain === "Misty" ? 95 : 80;
		break;
	case "Water Shuriken":
		basePower = (attacker.name === "Ash-Greninja" && attacker.ability === "Battle Bond") ? 20 : 15;
		description.moveBP = basePower;
		break;
	case "Misty Explosion":
		basePower = move.bp * (field.terrain === "Misty" ? 1.5 : 1);
		description.moveBP = basePower;
		break;
	case "Rising Voltage":
		basePower = move.bp * (field.terrain === "Electric" && isGrounded(defender, field.isGravity, defAbility === "Levitate") ? 2 : 1);
		description.moveBP = basePower;
		break;
	case "Expanding Force":
		basePower = field.terrain === "Psychic" ? move.bp * 1.5 : move.bp;
		move.isSpread = field.terrain === "Psychic";
		description.moveBP = basePower;
		break;
	case "Triple Axel":
		basePower = move.hits === 2 ? 30 : move.hits === 3 ? 40 : 20;
		description.moveBP = basePower;
		break;
	case "Last Respects":
		basePower = 50 + 50 * field.faintedCount;
		description.moveBP = basePower;
		break;
	case "Rage Fist":
		basePower = move.bp;
		description.moveBP = basePower;
		break;
	default:
		basePower = move.bp;
	}

	if (["Breakneck Blitz", "Bloom Doom", "Inferno Overdrive", "Hydro Vortex", "Gigavolt Havoc", "Subzero Slammer", "Supersonic Skystrike",
		"Savage Spin-Out", "Acid Downpour", "Tectonic Rage", "Continental Crush", "All-Out Pummeling", "Shattered Psyche", "Never-Ending Nightmare",
		"Devastating Drake", "Black Hole Eclipse", "Corkscrew Crash", "Twinkle Tackle"].indexOf(move.name) !== -1) {
		// show z-move power in description
		description.moveBP = move.bp;
	}

	var bpMods = [];
	if (gen >= 8) {
		// The location of these modifiers changed betweens gens 7 and 8 https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/post-8433978
		if (attacker.ability === "Technician" && basePower <= 60 ||
			attacker.ability === "Flare Boost" && attacker.status === "Burned" && move.category === "Special" ||
			attacker.ability === "Toxic Boost" && (attacker.status === "Poisoned" || attacker.status === "Badly Poisoned") && move.category === "Physical" ||
			attacker.ability === "Strong Jaw" && move.isBite ||
			attacker.ability === "Mega Launcher" && move.isPulse) {
			bpMods.push(0x1800);
			description.attackerAbility = attacker.ability;
		}
	}
	if (field.isSteelySpirit && move.type === "Steel") {
		bpMods.push(0x1800);
		description.isSteelySpirit = true;
	}

	var isAttackerAura = attacker.ability === move.type + " Aura";
	var isDefenderAura = defAbility === move.type + " Aura";
	var auraActive = $("input:checkbox[id='" + move.type.toLowerCase() + "-aura']:checked").val() != undefined;
	var auraBreak = $("input:checkbox[id='aura-break']:checked").val() != undefined;
	if (auraActive && auraBreak) {
		bpMods.push(0x0C00);
		description.attackerAbility = attacker.ability;
		description.defenderAbility = defAbility;
	}

	if ((attacker.ability === "Reckless" && (typeof move.hasRecoil === "number" || move.hasRecoil === "crash")) ||
		attacker.ability === "Iron Fist" && move.isPunch ||
		gen >= 7 && !move.isZ && (isAerilate || isPixilate || isRefrigerate || isNormalize || isGalvanize)) {
		bpMods.push(0x1333);
		description.attackerAbility = attacker.ability;
	}

	if (field.isBattery && move.category === "Special") {
		bpMods.push(0x14CD);
		description.isBattery = true;
	}
	if (field.isPowerSpot) {
		bpMods.push(0x14CD);
		description.isPowerSpot = true;
	}
	if (attacker.ability === "Sheer Force" && move.hasSecondaryEffect ||
		attacker.ability === "Analytic" && turnOrder !== "FIRST" ||
		attacker.ability === "Tough Claws" && move.makesContact ||
		gen == 6 && (isAerilate || isPixilate || isRefrigerate) ||
		attacker.ability == "Punk Rock" && move.isSound) {
		bpMods.push(0x14CD);
		description.attackerAbility = attacker.ability;
	} else if (attacker.ability === "Sand Force" && field.weather === "Sand" && ["Rock", "Ground", "Steel"].indexOf(move.type) !== -1) {
		bpMods.push(0x14CD);
		description.attackerAbility = attacker.ability;
		description.weather = field.weather;
	}

	var fainted = parseInt(field.faintedCount);
	if (attacker.ability === "Supreme Overlord" && fainted > 0) {
		// modifies the base power https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/post-9421520
		var multiplier;
		switch (fainted) {
			case 1:
				multiplier = 1.1;
				break;
			case 2:
				multiplier = 1.2;
				break;
			case 3:
				multiplier = 1.3;
				break;
			case 4:
				multiplier = 1.4;
				break;
			default:
				multiplier = 1.5;
		}
		bpMods.push(Math.ceil(0x1000 * multiplier));
		description.attackerAbility = attacker.ability + " (" + multiplier + "x BP)";
	}

	if (auraActive && !auraBreak) {
		bpMods.push(0x1548);
		if (isAttackerAura) {
			description.attackerAbility = attacker.ability;
		}
		if (isDefenderAura) {
			description.defenderAbility = defAbility;
		}
	}

	if (gen < 8) {
		// The location of these modifiers changed betweens gens 7 and 8 https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/post-8433978
		if (attacker.ability === "Technician" && basePower <= 60 ||
			attacker.ability === "Flare Boost" && attacker.status === "Burned" && move.category === "Special" ||
			attacker.ability === "Toxic Boost" && (attacker.status === "Poisoned" || attacker.status === "Badly Poisoned") && move.category === "Physical" ||
			attacker.ability === "Strong Jaw" && move.isBite ||
			attacker.ability === "Mega Launcher" && move.isPulse) {
			bpMods.push(0x1800);
			description.attackerAbility = attacker.ability;
		}
	}

	if (defAbility === "Heatproof" && move.type === "Fire") {
		bpMods.push(0x800);
		description.defenderAbility = defAbility;
	} else if (defAbility === "Dry Skin" && move.type === "Fire") {
		bpMods.push(0x1400);
		description.defenderAbility = defAbility;
	}
	if (attackerItem === "Muscle Band" && move.category === "Physical" ||
		attackerItem === "Wise Glasses" && move.category === "Special") {
		bpMods.push(0x1199); // confirmed to be 0x1199 from gens 5-9 by https://www.smogon.com/bw/articles/bw_complete_damage_formula and OZY's Twitter
		description.attackerItem = attackerItem;
	} else if (attackerItem === "Punching Glove" && move.isPunch) {
		// It seems to be an ever-so-slightly-different multiplier from Band/Glasses https://twitter.com/OZY_Project97/status/1604385021439094784
		bpMods.push(0x119A);
		description.attackerItem = attackerItem;
	} else if ((getItemBoostType(attackerItem) === move.type) ||
		((move.type === attacker.type1 || move.type === attacker.type2) && (
		attackerItem === "Adamant Orb" && attacker.name === "Dialga" ||
		attackerItem === "Lustrous Orb" && attacker.name === "Palkia" ||
		attackerItem === "Griseous Orb" && attacker.name === "Giratina-O" ||
		attackerItem === "Soul Dew" && gen >= 7 && (attacker.name === "Latios" || attacker.name === "Latias")))) {
		bpMods.push(0x1333);
		description.attackerItem = attackerItem;
	} else if (attackerItem === move.type + " Gem") {
		bpMods.push(gen >= 6 ? 0x14CD : 0x1800);
		description.attackerItem = attackerItem;
	}

	if ((move.name === "Solar Beam" || move.name == "SolarBeam") && ["Rain", "Sand", "Hail", "Heavy Rain", "Snow"].includes(field.weather)) {
		bpMods.push(0x800);
		description.moveBP = move.bp / 2;
		description.weather = field.weather;
	}

	if (gen >= 6 && gen != 8 && move.name === "Knock Off" && !((defender.item === "") ||
		(defender.name === "Giratina-O" && defender.item === "Griseous Orb") ||
		(defender.item.includes("Memory")) ||
		(defender.name.includes("Arceus") && defender.item.includes("Plate")) ||
		(defender.item.includes(" Z")))) {
		bpMods.push(0x1800);
		description.moveBP = move.bp * 1.5;
	} else if (gen === 8 && move.name === "Knock Off" && !((defender.item === "") ||
		(defender.name === "Giratina-O" && defender.item === "Griseous Orb") ||
		(defender.item.includes("Memory")) ||
		(defender.item.includes(" Z")))) {
		bpMods.push(0x1800);
		description.moveBP = move.bp * 1.5;
	}

	if (field.isHelpingHand) {
		bpMods.push(0x1800);
		description.isHelpingHand = true;
	}

	if (move.name === "Facade" && ["Burned", "Paralyzed", "Poisoned", "Badly Poisoned"].includes(attacker.status) ||
		move.name === "Brine" && defender.curHP <= defender.maxHP / 2 ||
		(move.name === "Venoshock" || move.name === "Barb Barrage") && (defender.status === "Poisoned" || defender.status === "Badly Poisoned")) {
		bpMods.push(0x2000);
		description.moveBP = move.bp * 2;
	}

	if (isGrounded(defender, field.isGravity, defAbility === "Levitate") && (
		field.terrain === "Misty" && move.type === "Dragon" ||
		field.terrain === "Grassy" && (move.name === "Bulldoze" || move.name === "Earthquake"))) {
		bpMods.push(0x800);
		description.terrain = field.terrain;
	}
	var terrainMultiplier = gen >= 8 ? 0x14CD : 0x1800;
	if (isGrounded(attacker, field.isGravity, attacker.ability === "Levitate")) {
		if (field.terrain === "Electric" && move.type === "Electric") {
			bpMods.push(terrainMultiplier);
			description.terrain = field.terrain;
		} else if (field.terrain === "Grassy" && move.type == "Grass") {
			bpMods.push(terrainMultiplier);
			description.terrain = field.terrain;
		} else if (field.terrain === "Psychic" && move.type == "Psychic") {
			bpMods.push(terrainMultiplier);
			description.terrain = field.terrain;
		}
	}

	basePower = Math.max(1, pokeRound((basePower * chainMods(bpMods)) / 4096));
	basePower = attacker.isChild ? basePower / (gen >= 7 ? 4 : 2) : basePower;
	
	var excludedExceptions = ["Low Kick", "Flail", "Reversal", "Eruption", "Water Spout", "Gyro Ball", "Fling", "Grass Knot", "Crush Grip", "Heavy Slam", "Electro Ball", "Heat Crash", "Dragon Energy"];
	if (attacker.isTerastal && move.type === attacker.type1 && basePower < 60 && !move.hasPriority && !move.maxMultiHits && !move.isTwoHit && !move.isThreeHit && !excludedExceptions.includes(move.name)) {
		basePower = 60; // https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/post-9425737
		description.moveBP = 60;
	}

	////////////////////////////////
	////////// (SP)ATTACK //////////
	////////////////////////////////
	var attack;
	var attackSource = move.name === "Foul Play" ? defender : attacker;
	if (move.usesHighestAttackStat || (move.name === "Tera Blast" && attacker.isTerastal)) {
		move.category = attackSource.stats[AT] > attackSource.stats[SA] ? "Physical" : "Special";
	}
	var attackStat = move.name === "Body Press" ? DF : move.category === "Physical" ? AT : SA;
	description.attackEVs = attacker.evs[attackStat] +
            (NATURES[attacker.nature][0] === attackStat ? "+" : NATURES[attacker.nature][1] === attackStat ? "-" : "") + " " +
            toSmogonStat(attackStat);
	if (attackSource.boosts[attackStat] === 0 || isCritical && attackSource.boosts[attackStat] < 0) {
		attack = attackSource.rawStats[attackStat];
	} else if (defAbility === "Unaware") {
		attack = attackSource.rawStats[attackStat];
		description.defenderAbility = defAbility;
	} else {
		attack = attackSource.stats[attackStat];
		description.attackBoost = attackSource.boosts[attackStat];
	}

	// unlike all other attack modifiers, Hustle gets applied directly
	if (attacker.ability === "Hustle" && move.category === "Physical") {
		attack = pokeRound(attack * 3 / 2);
		description.attackerAbility = attacker.ability;
	}

	var atMods = [];
 	if (attacker.ability === "Defeatist" && attacker.curHP <= attacker.maxHP / 2 ||
		attacker.ability === "Slow Start" && move.category === "Physical") {
		atMods.push(0x800);
		description.attackerAbility = attacker.ability;
	}

	if (attacker.ability === "Flower Gift" && field.weather.indexOf("Sun") > -1 && move.category === "Physical" ||
		attacker.ability === "Solar Power" && field.weather.indexOf("Sun") > -1 && move.category === "Special") {
		atMods.push(0x1800);
		description.attackerAbility = attacker.ability;
		description.weather = field.weather;
	} 
	if (attacker.ability === "Guts" && attacker.status !== "Healthy" && move.category === "Physical" ||
		attacker.ability === "Overgrow" && attacker.curHP <= attacker.maxHP / 3 && move.type === "Grass" ||
		attacker.ability === "Blaze" && attacker.curHP <= attacker.maxHP / 3 && move.type === "Fire" ||
		attacker.ability === "Torrent" && attacker.curHP <= attacker.maxHP / 3 && move.type === "Water" ||
		attacker.ability === "Swarm" && attacker.curHP <= attacker.maxHP / 3 && move.type === "Bug" ||
		attacker.ability === "Steelworker" && move.type === "Steel" ||
		attacker.ability === "Gorilla Tactics" && move.category === "Physical" && !attacker.isDynamax ||
		attacker.ability === "Transistor" && move.type === "Electric" ||
		attacker.ability === "Dragon's Maw" && move.type === "Dragon" ||
		attacker.ability === "Rocky Payload" && move.type === "Rock" ||
		attacker.ability === "Sharpness" && move.isSlicing) {
		atMods.push(0x1800);
		description.attackerAbility = attacker.ability;
	} else if (attacker.ability === "Flash Fire (activated)" && move.type === "Fire") {
		atMods.push(0x1800);
		description.attackerAbility = "Flash Fire";
	}

	if (attacker.ability === "Water Bubble" && move.type === "Water" ||
		(attacker.ability === "Huge Power" || attacker.ability === "Pure Power") && move.category === "Physical") {
		atMods.push(0x2000);
		description.attackerAbility = attacker.ability;
	}

	if ((attacker.ability === "Hadron Engine" && field.terrain === "Electric" && move.category === "Special") ||
		(attacker.ability === "Orichalcum Pulse" && field.weather.indexOf("Sun") > -1 && move.category === "Physical")) {
		atMods.push(0x1555); // https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/post-9423025
		description.attackerAbility = attacker.ability;
	}
	var attackerProtoQuark = checkProtoQuarkHighest(attacker, field.weather, field.terrain);
	if ((attackerProtoQuark === "Atk" && move.category === "Physical") ||
		(attackerProtoQuark === "SpA" && move.category === "Special")) {
		atMods.push(0x14CD); // https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/post-9423025
		description.attackerAbility = attacker.ability;
	}

	if ((field.isRuinTablets && move.category === "Physical") || (field.isRuinVessel && move.category === "Special")) {
		atMods.push(0xC00);
		description.isRuinAtk = true;
	}

	if (defAbility === "Thick Fat" && (move.type === "Fire" || move.type === "Ice") ||
		defAbility === "Water Bubble" && move.type === "Fire" ||
		defAbility === "Purifying Salt" && move.type === "Ghost") {
		atMods.push(0x800);
		description.defenderAbility = defAbility;
	}

	if (attackerItem === "Soul Dew" && gen < 7 && (attacker.name === "Latios" || attacker.name === "Latias") && move.category === "Special" ||
		attackerItem === "Choice Band" && (move.category === "Physical" || move.name === "Body Press") ||
		attackerItem === "Choice Specs" && move.category === "Special" && !move.isZ) {
		atMods.push(0x1800);
		description.attackerItem = attackerItem;
	} else if (attackerItem === "Thick Club" && (attacker.name === "Cubone" || attacker.name === "Marowak" || attacker.name === "Marowak-Alola") && move.category === "Physical" ||
		attackerItem === "Deep Sea Tooth" && attacker.name === "Clamperl" && move.category === "Special" ||
		attackerItem === "Light Ball" && attacker.name === "Pikachu" && !move.isZ) {
		atMods.push(0x2000);
		description.attackerItem = attackerItem;
	}

	attack = Math.max(1, pokeRound(attack * chainMods(atMods) / 0x1000));

	if (move.name === "Meteor Beam") {
		attacker.boosts[SA] = attacker.ability === "Simple" ? (attacker.boosts[SA] - 2) : (attacker.ability === "Contrary" ? (attacker.boosts[SA] + 1) : (attacker.boosts[SA] - 1));
		attacker.stats[SA] = getModifiedStat(attacker.rawStats[SA], attacker.boosts[SA]);
	}

	////////////////////////////////
	///////// (SP)DEFENSE //////////
	////////////////////////////////
	var defense;
	var hitsPhysical = move.category === "Physical" || move.dealsPhysicalDamage;
	var defenseStat = hitsPhysical ? DF : SD;
	description.defenseEVs = defender.evs[defenseStat] +
            (NATURES[defender.nature][0] === defenseStat ? "+" : NATURES[defender.nature][1] === defenseStat ? "-" : "") + " " +
            toSmogonStat(defenseStat);
	if (defender.boosts[defenseStat] === 0 || isCritical && defender.boosts[defenseStat] > 0 || move.ignoresDefenseBoosts) {
		defense = defender.rawStats[defenseStat];
	} else if (attacker.ability === "Unaware") {
		defense = defender.rawStats[defenseStat];
		description.attackerAbility = attacker.ability;
	} else {
		defense = defender.stats[defenseStat];
		description.defenseBoost = defender.boosts[defenseStat];
	}

	// unlike all other defense modifiers, Sandstorm SpD boost gets applied directly
	if ((field.weather === "Sand" && (defender.type1 === "Rock" || defender.type2 === "Rock") && !hitsPhysical) ||
		(field.weather === "Snow" && (defender.type1 === "Ice" || defender.type2 === "Ice") && hitsPhysical)) {
		defense = pokeRound(defense * 3 / 2);
		description.weather = field.weather;
	}

	var dfMods = [];
	if (defAbility === "Flower Gift" && field.weather.indexOf("Sun") > -1 && !hitsPhysical) {
		dfMods.push(0x1800);
		description.defenderAbility = defAbility;
		description.weather = field.weather;
	}
	if (defAbility === "Marvel Scale" && defender.status !== "Healthy" && hitsPhysical ||
		defAbility === "Grass Pelt" && field.terrain === "Grassy" && hitsPhysical) {
		dfMods.push(0x1800);
		description.defenderAbility = defAbility;
	}

	if (defAbility === "Fur Coat" && hitsPhysical) {
		dfMods.push(0x2000);
		description.defenderAbility = defAbility;
	}

	var defenderProtoQuark = checkProtoQuarkHighest(defender, field.weather, field.terrain);
	if ((defenderProtoQuark === "Def" && move.category === "Physical") || (defenderProtoQuark === "SpD" && move.category === "Special")) {
		dfMods.push(0x14CD);
		description.defenderAbility = defAbility;
	}

	if ((field.isRuinSword && move.category === "Physical") || (field.isRuinBeads && move.category === "Special")) {
		dfMods.push(0xC00);
		description.isRuinDef = true;
	}

	if (defender.item === "Soul Dew" && gen < 7 && (defender.name === "Latios" || defender.name === "Latias") && !hitsPhysical ||
		defender.item === "Assault Vest" && !hitsPhysical ||
		defender.item === "Eviolite") {
		dfMods.push(0x1800);
		description.defenderItem = defender.item;
	}

	if (defender.item === "Deep Sea Scale" && defender.name === "Clamperl" && !hitsPhysical ||
		defender.item === "Metal Powder" && defender.name === "Ditto" && hitsPhysical) {
		dfMods.push(0x2000);
		description.defenderItem = defender.item;
	}

	defense = Math.max(1, pokeRound(defense * chainMods(dfMods) / 0x1000));

	////////////////////////////////
	//////////// DAMAGE ////////////
	////////////////////////////////
	var baseDamage = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * basePower * attack / defense) / 50 + 2);
	if (field.format === "doubles" && move.isSpread) {
		baseDamage = pokeRound(baseDamage * 0xC00 / 0x1000);
		description.isSpread = true;
	}
	if (field.weather.indexOf("Sun") > -1 && move.type === "Fire" || field.weather.indexOf("Rain") > -1 && move.type === "Water") {
		baseDamage = pokeRound(baseDamage * 0x1800 / 0x1000);
		description.weather = field.weather;
	} else if (field.weather === "Sun" && move.type === "Water" || field.weather === "Rain" && move.type === "Fire" ||
               field.weather === "Strong Winds" && (defender.type1 === "Flying" || defender.type2 === "Flying") &&
               typeChart[move.type]["Flying"] > 1) {
		baseDamage = pokeRound(baseDamage * 0x800 / 0x1000);
		description.weather = field.weather;
	}
	if (isCritical) {
		baseDamage = Math.floor(baseDamage * (gen >= 6 ? 1.5 : 2));
		description.isCritical = isCritical;
	}
	// the random factor is applied between the crit mod and the stab mod, so don't apply anything below this until we're inside the loop
	var stabMod = 0x1000;
	if (attacker.isTerastal) {
		if (move.type === attacker.type1) {
			if (attacker.ability === "Adaptability") {
				stabMod = (move.type === attacker.dexType1 || move.type === attacker.dexType2) ? 0x2400 : 0x2000;
				description.attackerAbility = attacker.ability;
			} else {
				stabMod = (move.type === attacker.dexType1 || move.type === attacker.dexType2) ? 0x2000 : 0x1800;
			}
			description.attackerTera = attacker.type1;
		}
		else if (move.type === attacker.dexType1 || move.type === attacker.dexType2) {
			stabMod = 0x1800;
		}
	}
	else if (move.type === attacker.type1 || move.type === attacker.type2) {
		if (attacker.ability === "Adaptability") {
			stabMod = 0x2000;
			description.attackerAbility = attacker.ability;
		} else {
			stabMod = 0x1800;
		}
	} else if (attacker.ability === "Protean" || attacker.ability == "Libero") {
		stabMod = 0x1800;
		description.attackerAbility = attacker.ability;
	}
	var applyBurn = attacker.status === "Burned" && move.category === "Physical" && attacker.ability !== "Guts" && !move.ignoresBurn;
	description.isBurned = applyBurn;
	var finalMods = [];
	var ignoresScreens = isCritical || ["Brick Break", "Psychic Fangs", "Raging Bull"].includes(move.name) || attacker.ability === "Infiltrator";
	if (field.isReflect && move.category === "Physical" && !ignoresScreens) {
		finalMods.push(field.format !== "Singles" ? 0xA8F : 0x800);
		description.isReflect = true;
	} else if (field.isLightScreen && move.category === "Special" && !ignoresScreens) {
		finalMods.push(field.format !== "Singles" ? 0xA8F : 0x800);
		description.isLightScreen = true;
	}
	if (attacker.ability === "Neuroforce" && typeEffectiveness > 1) {
		finalMods.push(0x1400);
		description.attackerAbility = attacker.ability;
	}
	if (attacker.ability === "Sniper" && isCritical) {
		finalMods.push(0x1800);
		description.attackerAbility = attacker.ability;
	}
	if (attacker.ability === "Tinted Lens" && typeEffectiveness < 1) {
		finalMods.push(0x2000);
		description.attackerAbility = attacker.ability;
	}
	if (((defAbility === "Multiscale" || defAbility == "Shadow Shield") && defender.curHP === defender.maxHP) ||
		defAbility === "Fluffy" && move.makesContact ||
		defAbility === "Punk Rock" && move.isSound ||
		defAbility === "Ice Scales" && move.category === "Special") {
		finalMods.push(0x800);
		description.defenderAbility = defAbility;
	}
	if (field.isFriendGuard) {
		finalMods.push(0xC00);
		description.isFriendGuard = true;
	}
	if ((defAbility === "Solid Rock" || defAbility === "Filter" || defAbility === "Prism Armor") && typeEffectiveness > 1) {
		finalMods.push(0xC00);
		description.defenderAbility = defAbility;
	}
	if (defAbility === "Fluffy" && move.type === "Fire") {
		finalMods.push(0x2000);
		description.defenderAbility = defAbility;
	}
	if (attackerItem === "Expert Belt" && typeEffectiveness > 1 && !move.isZ) {
		finalMods.push(0x1333);
		description.attackerItem = attackerItem;
	} else if (attackerItem === "Life Orb" && !move.isZ) {
		finalMods.push(0x14CC);
		description.attackerItem = attackerItem;
	}
	if (getBerryResistType(defender.item) === move.type && (typeEffectiveness > 1 || move.type === "Normal") &&
		attacker.ability !== "Unnerve") {
		finalMods.push(0x800);
		description.defenderItem = defender.item;
	}
	if (field.isMinimized && (["Astonish", "Body Slam", "Dragon Rush", "Extrasensory", "Flying Press", "Heat Crash", "Heavy Slam", "Malicious Moonsault", "Needle Arm", "Phantom Force", "Shadow Force", "Steamroller", "Stomp"].includes(move.name))) {
		finalMods.push(0x2000);
		description.isMinimized = true;
	}
	if ((move.name === "Dynamax Cannon" || move.name === "Behemoth Blade" || move.name === "Behemoth Bash") && defender.isDynamax) {
		finalMods.push(0x2000);
	}
	if (typeEffectiveness > 1 && (move.name === "Collision Course" || move.name === "Electro Drift")) {
		finalMods.push(0x1555); // https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/post-9423025
	}
	var finalMod = chainMods(finalMods);

	if (field.isProtect && !bypassProtect) {
		finalMod = pokeRound(finalMod * 0x400 / 0x1000);
		description.isQuarteredByProtect = true;
	}

	var damage = [], pbDamage = [];
	var child, childDamage, j;
	if (attacker.ability === "Parental Bond" && move.hits === 1 && (field.format === "Singles" || !move.isSpread)) {
		child = JSON.parse(JSON.stringify(attacker));
		child.rawStats = attacker.rawStats;
		child.stats = attacker.stats;
		child.ability = "";
		child.isChild = true;
		if (move.name === "Power-Up Punch") {
			child.boosts[AT] = Math.min(6, child.boosts[AT] + 1);
			child.stats[AT] = getModifiedStat(child.rawStats[AT], child.boosts[AT]);
		}
		childDamage = getDamageResult(child, defender, move, field).damage;
		description.attackerAbility = attacker.ability;
		if (move.name === "Power-Up Punch") {
			child.boosts[AT]--;
			child.stats[AT] = getModifiedStat(child.rawStats[AT], child.boosts[AT]);
		}
	}
	for (var i = 0; i < 16; i++) {
		damage[i] = Math.floor(baseDamage * (85 + i) / 100);
		damage[i] = pokeRound(damage[i] * stabMod / 0x1000);
		damage[i] = Math.floor(damage[i] * typeEffectiveness);
		if (applyBurn) {
			damage[i] = Math.floor(damage[i] / 2);
		}
		damage[i] = Math.max(1, pokeRound(damage[i] * finalMod / 0x1000) % 65536);
		if (["Grass Knot", "Low Kick", "Heat Crash", "Heavy Slam"].includes(move.name) && defender.isDynamax) {
			damage[i] = 0;
			description.isZeroVsDynamax = true;
		}
		if (attacker.ability === "Parental Bond" && move.hits === 1 && (field.format === "Singles" || !move.isSpread)) {
			for (j = 0; j < 16; j++) {
				pbDamage[16 * i + j] = damage[i] + childDamage[j];
			}
		}
	}
	// Return a bit more info if this is a Parental Bond usage.
	if (pbDamage.length) {
		return {
			"damage": pbDamage.sort(numericSort),
			"parentDamage": damage,
			"childDamage": childDamage,
			"description": buildDescription(description)
		};
	}
	return {"damage": pbDamage.length ? pbDamage.sort(numericSort) : damage, "description": buildDescription(description)};
}

function numericSort(a, b) {
	return a - b;
}

function buildDescription(description) {
	var output = "";
	if (description.attackBoost) {
		if (description.attackBoost > 0) {
			output += "+";
		}
		output += description.attackBoost + " ";
	}
	output = appendIfSet(output, description.attackEVs);
	output = appendIfSet(output, description.attackerItem);
	output = appendIfSet(output, description.attackerAbility);
	if (description.isRuinAtk) {
		output += "Ruin ";
	}
	if (description.isBurned) {
		output += "burned ";
	}
	if (description.attackerTera) {
		output += "Tera " + description.attackerTera + " ";
	}
	output += description.attackerName + " ";
	if (description.isHelpingHand) {
		output += "Helping Hand ";
	}
	if (description.isPowerSpot) {
		output += "Power Spot ";
	}
	if (description.isBattery) {
		output += "Battery ";
	}
	if (description.isSteelySpirit) {
		output += "Steely Spirit ";
	}
	output += description.moveName + " ";
	if (description.moveBP && description.moveType) {
		output += "(" + description.moveBP + " BP " + description.moveType + ") ";
	} else if (description.moveBP) {
		output += "(" + description.moveBP + " BP) ";
	} else if (description.moveType) {
		output += "(" + description.moveType + ") ";
	}
	if (description.hits) {
		output += "(" + description.hits + " hits) ";
	}
	if (description.isSpread) {
		output += "(spread) ";
	}
	output += "vs. ";
	if (description.defenseBoost) {
		if (description.defenseBoost > 0) {
			output += "+";
		}
		output += description.defenseBoost + " ";
	}
	output = appendIfSet(output, description.HPEVs);
	if (description.defenseEVs) {
		output += " / " + description.defenseEVs + " ";
	}
	output = appendIfSet(output, description.defenderItem);
	output = appendIfSet(output, description.defenderAbility);
	if (description.isMinimized) {
		output += "Minimized ";
	}
	if (description.isDynamax) {
		output += "Dynamax ";
	}
	if (description.isRuinDef) {
		output += "Ruin ";
	}
	if (description.defenderTera) {
		output += "Tera " + description.defenderTera + " ";
	}
	output += description.defenderName;
	if (description.weather) {
		output += " in " + description.weather;
	} else if (description.terrain) {
		output += " in " + description.terrain + " Terrain";
	}
	if (description.isReflect) {
		output += " through Reflect";
	} else if (description.isLightScreen) {
		output += " through Light Screen";
	}
	if (description.isCritical) {
		output += " on a critical hit";
	}
	if (description.isFriendGuard) {
		output += " with Friend Guard";
	}
	if (description.isQuarteredByProtect) {
		output += " through Protect";
	}
	if (description.isZeroVsDynamax) {
		output += " (this move has No Effect against Dynamax Pokémon!)";
	}

	return output;
}

function appendIfSet(str, toAppend) {
	if (toAppend) {
		return str + toAppend + " ";
	}
	return str;
}

function toSmogonStat(stat) {
	return stat === AT ? "Atk" :
		stat === DF ? "Def" :
			stat === SA ? "SpA" :
				stat === SD ? "SpD" :
					stat === SP ? "Spe" :
						"wtf";
}

function chainMods(mods) {
	var M = 0x1000;
	for (var i = 0; i < mods.length; i++) {
		if (mods[i] !== 0x1000) {
			M = M * mods[i] + 0x800 >> 12;
		}
	}
	return M;
}

function getMoveEffectiveness(move, type, isGhostRevealed, isGravity) {
	if (isGhostRevealed && type === "Ghost" && (move.type === "Normal" || move.type === "Fighting")) {
		return 1;
	} else if (isGravity && type === "Flying" && move.type === "Ground") {
		return 1;
	} else if (move.name === "Freeze-Dry" && type === "Water") {
		return 2;
	} else if (move.name === "Flying Press") {
		return typeChart["Fighting"][type] * typeChart["Flying"][type];
	} else {
		return typeChart[move.type][type];
	}
}

function getModifiedStat(stat, mod) {
	const boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];

	if (mod >= 0) {
		stat = Math.floor(stat * boostTable[mod]);
	} else {
		stat = Math.floor(stat / boostTable[-mod]);
	}

	return stat;
}

function getFinalSpeed(pokemon, weather, terrain) {
	var speed = getModifiedStat(pokemon.rawStats[SP], pokemon.boosts[SP]);
	if (pokemon.item === "Choice Scarf" && !pokemon.isDynamax) {
		speed = Math.floor(speed * 1.5);
	} else if (pokemon.item === "Macho Brace" || pokemon.item === "Iron Ball") {
		speed = Math.floor(speed / 2);
	}
	
	if (pokemon.ability === "Chlorophyll" && weather.indexOf("Sun") > -1 ||
            pokemon.ability === "Sand Rush" && weather === "Sand" ||
            pokemon.ability === "Swift Swim" && weather.indexOf("Rain") > -1 ||
            pokemon.ability === "Slush Rush" && (weather.indexOf("Hail") > -1 || weather === "Snow") ||
            pokemon.ability === "Surge Surfer" && terrain === "Electric") {
		speed *= 2;
	} else if (checkProtoQuarkHighest(pokemon, weather, terrain) === "Spe") {
		speed = Math.floor(speed * 1.5);
	}
	return speed;
}

function isGrounded(pokemon, isGravity, isLevitate) {
	if (pokemon.type1 === "Flying" || pokemon.type2 === "Flying" || pokemon.item === "Air Balloon" || isLevitate) {
		return (isGravity || pokemon.item === "Iron Ball");
	}
	return true;
}

function checkAirLock(pokemon, field) {
	if (pokemon.ability === "Air Lock" || pokemon.ability === "Cloud Nine") {
		field.clearWeather();
	}
}

function checkParentalBondPuP(pokemon) {
	var moveArray = [];
	for (var l = 0; l < pokemon.moves.length; l++) {
		moveArray.push(pokemon.moves[l].name);
	}
	if (pokemon.ability === "Parental Bond" && moveArray.indexOf("Power-Up Punch")) {
		alert("Please ensure that Power-up Punch is in the 4th moveslot, otherwise you may experience some errors in calcs!");
	}
}

function checkForecast(pokemon, weather) {
	if (pokemon.ability === "Forecast" && pokemon.name === "Castform") {
		if (weather.indexOf("Sun") > -1) {
			pokemon.type1 = "Fire";
		} else if (weather.indexOf("Rain") > -1) {
			pokemon.type1 = "Water";
		} else if (weather === "Hail" || weather === "Snow") {
			pokemon.type1 = "Ice";
		} else {
			pokemon.type1 = "Normal";
		}
		pokemon.type2 = "";
	}
}
function checkKlutz(pokemon) {
	if (pokemon.ability === "Klutz") {
		pokemon.item = "";
	}
}

function checkDownload(source, target) {
	if (source.ability === "Download") {
		if (target.stats[SD] <= target.stats[DF]) {
			source.boosts[SA] = Math.min(6, source.boosts[SA] + 1);
		} else {
			source.boosts[AT] = Math.min(6, source.boosts[AT] + 1);
		}
	}
}

function checkSeeds(pokemon, terrain) {
	var ability = pokemon.ability;
	if ((pokemon.item === "Psychic Seed" && terrain === "Psychic") ||
		(pokemon.item === "Misty Seed" && terrain === "Misty")) {
		pokemon.boosts[SD] = ability === "Simple" ? Math.min(6, pokemon.boosts[SD] + 2) : (ability === "Contrary" ? Math.max(-6, pokemon.boosts[SD] - 1) : Math.min(6, pokemon.boosts[SD] + 1));
	} else if ((pokemon.item === "Electric Seed" && terrain === "Electric") ||
			   (pokemon.item === "Grassy Seed" && terrain === "Grassy")) {
		pokemon.boosts[DF] = ability === "Simple" ? Math.min(6, pokemon.boosts[DF] + 2) : (ability === "Contrary" ? Math.max(-6, pokemon.boosts[DF] - 1) : Math.min(6, pokemon.boosts[DF] + 1));
	}
}

function checkSeedsHonk(pokemon, terrain) {
	// A Seed can either come into the field that has the matching terrain, or its own Surge ability can proc its own Seed (Pincurchin-RS)
	var ability = pokemon.ability;
	if ((pokemon.item === "Psychic Seed" && (terrain === "Psychic" || ability === "Psychic Surge")) ||
		(pokemon.item === "Misty Seed" && (terrain === "Misty" || ability === "Misty Surge"))) {
		pokemon.boosts[SD] = ability === "Simple" ? Math.min(6, pokemon.boosts[SD] + 2) : (ability === "Contrary" ? Math.max(-6, pokemon.boosts[SD] - 1) : Math.min(6, pokemon.boosts[SD] + 1));
	} else if ((pokemon.item === "Electric Seed" && (terrain === "Electric" || ability === "Electric Surge")) ||
		(pokemon.item === "Grassy Seed" && (terrain === "Grassy" || ability === "Grassy Surge"))) {
		pokemon.boosts[DF] = ability === "Simple" ? Math.min(6, pokemon.boosts[DF] + 2) : (ability === "Contrary" ? Math.max(-6, pokemon.boosts[DF] - 1) : Math.min(6, pokemon.boosts[DF] + 1));
	}
}

function checkZacianZamazaenta(pokemon) {
	if (pokemon.ability === "Intrepid Sword") {
		pokemon.boosts[AT] = Math.min(6, pokemon.boosts[AT] + 1);
	} else if (pokemon.ability === "Dauntless Shield") {
		pokemon.boosts[DF] = Math.min(6, pokemon.boosts[DF] + 1);
	}
}

function predictShellSideArm(attacker, defender, move) {
	if (move.name === "Shell Side Arm" && (attacker.stats[AT] / defender.stats[DF]) > (attacker.stats[SA] / defender.stats[SD])) {
		move.category = "Physical";
		move.makesContact = true;
	}
}

function checkProtoQuarkHighest(pokemon, weather, terrain) {
	if ((pokemon.ability === "Protosynthesis" && (pokemon.item === "Booster Energy" || weather.indexOf("Sun") > -1)) ||
		(pokemon.ability === "Quark Drive" && (pokemon.item === "Booster Energy" || terrain === "Electric"))) {
		var stats = pokemon.stats;
		var highestStat = "Atk";
		var highestValue = stats.at;
		if (stats.df > highestValue) {
			highestStat = "Def";
			highestValue = stats.df;
		}
		if (stats.sa > highestValue) {
			highestStat = "SpA";
			highestValue = stats.sa;
		}
		if (stats.sd > highestValue) {
			highestStat = "SpD";
			highestValue = stats.sd;
		}
		if (stats.sp > highestValue) {
			return "Spe";
		}
		return highestStat;
	}
	return "";
}

function checkAngerShell(pokemon) {
	if (pokemon.ability === "Anger Shell" && pokemon.curHP <= pokemon.maxHP / 2) {
		pokemon.boosts[AT] = Math.min(6, pokemon.boosts[AT] + 1);
		pokemon.boosts[SA] = Math.min(6, pokemon.boosts[SA] + 1);
		pokemon.boosts[SP] = Math.min(6, pokemon.boosts[SP] + 1);
		pokemon.boosts[DF] = Math.max(-6, pokemon.boosts[DF] - 1);
		pokemon.boosts[SD] = Math.max(-6, pokemon.boosts[SD] - 1);
	}
}

function checkIntimidate(source, target) {
	if (source.ability === "Intimidate") {
		if (target.ability === "Contrary" || target.ability === "Defiant" || target.ability === "Guard Dog") {
			target.boosts[AT] = Math.min(6, target.boosts[AT] + 1);
		} else if (target.ability === "Competitive") {
			target.boosts[SA] = Math.min(6, target.boosts[SA] + 2);
		} else if (["Clear Body", "White Smoke", "Hyper Cutter", "Full Metal Body"].includes(target.ability) || (gen > 7 && ["Inner Focus", "Oblivious", "Scrappy", "Own Tempo"].includes(target.ability)) || target.item === "Clear Amulet") {
			// no effect (going by how Adrenaline Orb and Defiant work, checking these should come second)
		} else if (target.ability === "Simple") {
			target.boosts[AT] = Math.max(-6, target.boosts[AT] - 2);
		} else if (target.ability === "Mirror Armor" && source.item !== "Clear Amulet") {
			source.boosts[AT] = Math.max(-6, source.boosts[AT] - 1);
		} else {
			target.boosts[AT] = Math.max(-6, target.boosts[AT] - 1);
		}
	}
}

function checkMinimize(p1, p2) {
	if ($("#minimL").prop("checked")) {
		p1.boosts[ES] = Math.min(6, p2.boosts[ES] + 2);
	}
	if ($("#minimR").prop("checked")) {
		p2.boosts[ES] = Math.min(6, p2.boosts[ES] + 2);
	}
}

function checkEvo(p1, p2) {
	if ($("#evoL").prop("checked")) {
		p1.boosts[AT] = Math.min(6, p1.boosts[AT] + 2);
		p1.boosts[DF] = Math.min(6, p1.boosts[DF] + 2);
		p1.boosts[SA] = Math.min(6, p1.boosts[SA] + 2);
		p1.boosts[SD] = Math.min(6, p1.boosts[SD] + 2);
		p1.boosts[SP] = Math.min(6, p1.boosts[SP] + 2);
	}
	if ($("#evoR").prop("checked")) {
		p2.boosts[AT] = Math.min(6, p2.boosts[AT] + 2);
		p2.boosts[DF] = Math.min(6, p2.boosts[DF] + 2);
		p2.boosts[SA] = Math.min(6, p2.boosts[SA] + 2);
		p2.boosts[SD] = Math.min(6, p2.boosts[SD] + 2);
		p2.boosts[SP] = Math.min(6, p2.boosts[SP] + 2);
	}

	if ($("#clangL").prop("checked")) {
		p1.boosts[AT] = Math.min(6, p1.boosts[AT] + 1);
		p1.boosts[DF] = Math.min(6, p1.boosts[DF] + 1);
		p1.boosts[SA] = Math.min(6, p1.boosts[SA] + 1);
		p1.boosts[SD] = Math.min(6, p1.boosts[SD] + 1);
		p1.boosts[SP] = Math.min(6, p1.boosts[SP] + 1);
	}
	if ($("#clangR").prop("checked")) {
		p2.boosts[AT] = Math.min(6, p2.boosts[AT] + 1);
		p2.boosts[DF] = Math.min(6, p2.boosts[DF] + 1);
		p2.boosts[SA] = Math.min(6, p2.boosts[SA] + 1);
		p2.boosts[SD] = Math.min(6, p2.boosts[SD] + 1);
		p2.boosts[SP] = Math.min(6, p2.boosts[SP] + 1);
	}

	if ($("#wpL").prop("checked")) {
		p1.boosts[AT] = Math.min(6, p1.boosts[AT] + 2);
		p1.boosts[SA] = Math.min(6, p1.boosts[SA] + 2);
	}
	if ($("#wpR").prop("checked")) {
		p2.boosts[AT] = Math.min(6, p2.boosts[AT] + 2);
		p2.boosts[SA] = Math.min(6, p2.boosts[SA] + 2);
	}
}

function countBoosts(boosts) {
	var sum = 0;
	for (var i = 0; i < STATS.length; i++) {
		if (boosts[STATS[i]] > 0) {
			sum += boosts[STATS[i]];
		}
	}
	return sum;
}

// GameFreak rounds DOWN on .5
function pokeRound(num) {
	return num % 1 > 0.5 ? Math.ceil(num) : Math.floor(num);
}