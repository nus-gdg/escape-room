var _ = require('lodash'); 
var fs = require('fs');

var Parser = require("./CommandParser.js");
var Passage = require("./PassageResolver.js");

function emptyPassagePayload() {
	return {
		content: {
			"text": "",
			"image": []
		}
	};
}

function GameInstance() {
	this.state = {};
	this.state.variables = {};
	
	// load model
	let rawdata = fs.readFileSync(arguments[0]);
	this.model = JSON.parse(rawdata);
	
	// set initial room
	this.state.variables.currentRoom = this.model.startRoom;
	
	// set initial flags
	_.forEach(this.model.rooms, (roomValue, roomName) => {
		this.state.variables[roomName] = {};
		_.forEach(roomValue.initialFlags, (flagValue, flagName) => {
			this.state.variables[roomName][flagName] = flagValue;
		})
	});
	
	// init inventory
	this.state.variables.inventory = {};
	
	// functions
	this.greet = () => {
		
	};
	
	// string -> passagePayload
	this.interact = (input) => {
		let passageList = {};
		
		let parseResult = Parser.parse(input, this.model.verbs);
		
		// if not match verb list
		if (_.isEmpty(parseResult)){
			return Passage.resolve(this.model.defaultVerbMessage, this.state.variables[this.state.variables.currentRoom]).payload;
		}
		
		// if fail check 
		if (!Parser.verify(parseResult, this.state.variables.inventory, this.model.rooms[this.state.variables.currentRoom].interactables)) {
			return Passage.resolve(this.model.verbs[parseResult.verbId].default, this.state.variables[this.state.variables.currentRoom], this.state.variables.inventory).payload;
		}
		
		let foundMatch = false;
		
		// inventory 
		if (parseResult.verb === "inventory") {
			return listInventory();
		}
		
		// verbs
		if (parseResult.verb === "list verbs" || parseResult.verb === "help" ) {
			return listVerbs();
		}
		
		// look around
		_.forEach(this.model.rooms[this.state.variables.currentRoom], (value, key) => {
			if (key === parseResult.actor) {
				foundMatch = true;
				passageList = this.model.rooms[this.state.variables.currentRoom][key];
				return false;
			}
		});
		
		// world interactables
		_.forEach(this.model.rooms[this.state.variables.currentRoom].interactables, (value, key) => {
			if (key === parseResult.actee && _.has(value, parseResult.actor)) {
				foundMatch = true;
				passageList = this.model.rooms[this.state.variables.currentRoom].interactables[key][parseResult.actor];
				return false;
			}
		});
		
		// items
		_.forEach(this.state.variables.inventory, (hasItem, key) => {
			if (key === parseResult.actor && hasItem && _.has(this.model.items[key], parseResult.actee)) {
				foundMatch = true;
				passageList = this.model.items[key][parseResult.actee];
				return false;
			}
		});
		
		const resp = Passage.resolve(foundMatch ? passageList : this.model.verbs[parseResult.verbId].default, this.state.variables[this.state.variables.currentRoom], this.state.variables.inventory);
		
		// empty check
		if (resp.isEmpty) {
			return Passage.resolve(this.model.verbs[parseResult.verbId].default, this.state.variables[this.state.variables.currentRoom], this.state.variables.inventory).payload;
		}
		
		const payload = resp.payload;
		
		// handle any stateChange
		handleResp(resp);
		
		// handle addContentTag
		const additionalContent = handleAdditionalContent(resp);
		return combinePayload(payload, additionalContent);
	};
	
	// change state
	// passageResp -> -
	let handleResp = (resp) => {
		if (_.has(resp, "flagChanges")) {
			_.forEach(resp.flagChanges, (value, key) => {
				this.state.variables[this.state.variables.currentRoom][key] = value;
			});
		}
		if (_.has(resp, "roomChange") && resp.roomChange) {
			this.state.variables.currentRoom = resp.roomChange;
		}
		if (_.has(resp, "addInventory")) {
			_.forEach(resp.addInventory, (value) => {
				this.state.variables.inventory[value] = true;
			});
		}
		if (_.has(resp, "removeInventory")) {
			_.forEach(resp.removeInventory, (value) => {
				this.state.variables.inventory[value] = false;
			});
		}
	};
	
	// change state
	// passageResp -> passagePayload
	let handleAdditionalContent = (resp) => {
		if (_.has(resp, "addContent") && resp.addContent) {
			return this.interact(resp.addContent);
		}
		
		return emptyPassagePayload();
	};
	
	// passagePayload, passagePayload -> passagePayload
	let combinePayload = (pl1, pl2) => {
		let returnObject = emptyPassagePayload();
		
		returnObject.content.text = pl1.content.text + pl2.content.text;
		returnObject.content.image = pl1.content.image.concat(pl2.content.image);
		
		return returnObject;
	};
	
	
	let listInventory = () => {
		let returnObject = emptyPassagePayload();
		
		returnObject.content.text += "You look in your pockets and see the following: \n"
		let itemCount = 0;
		_.forEach(this.state.variables.inventory, (value, key) => {
			if (value) {
				itemCount++;
				returnObject.content.text += "  - " + key + "\n";
			}
		});
		if (itemCount === 0) {
			returnObject.content.text += "  - a whole lot of nothing\n"
		}
		
		return returnObject;
	};
	
	
	let listVerbs = () => {
		let returnObject = emptyPassagePayload();
		
		returnObject.content.text += "Verbs and words you know: \n"
		_.forEach(this.model.verbs, (verb) => {
			returnObject.content.text += "  - " + verb.desc + "\n";
		});
		
		return returnObject;
	};
}

module.exports = GameInstance;
