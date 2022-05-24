var _ = require('lodash'); 
var fs = require('fs');

var Parser = require("./CommandParser.js");
var Passage = require("./PassageResolver.js");

function emptyPassagePayload() {
	return {
		content: {
			"title": "",
			"text": [],
			"image": []
		}
	};
}

function GameInstance() {
	this.state = {};
	this.state.globalFlags = {};
	
	// load model
	let rawdata;
	try {
		rawdata = fs.readFileSync(arguments[0]);
	} catch (err) {
		return err;
	}
	this.model = JSON.parse(rawdata);
	
	// set initial room
	this.state.currentRoom = this.model.initialRoom;
	
	// set initial flags
	_.forEach(this.model.initialState, (flagValue, flagName) => {
		this.state.globalFlags[flagName] = flagValue;
	});
	
	this.state.inventory = {};
	
	this.start = () => {
		return printRoom();
	};
	
	this.react = (input) => {
		let reactionObject = _.find(this.model.rooms[this.state.currentRoom].reactionOptions, x => x.emoji === input);
		
		if (satisfiesFlagConditions(reactionObject.requiresFlag) && satisfiesItemConditions(reactionObject.requiresItem)) {
			changeRoom(reactionObject.destination);
		}
		
		return printRoom();
	};
	
	this.response = (input) => {
		let matchResult = {};
		
		// find in room first
		_.forEach(this.model.rooms[this.state.currentRoom].textOptions, textOptionObject => {
			const filter = new RegExp(textOptionObject.regex, "i");
			const match = input.match(filter);
			if (match) {
				let keyId = _.join(match.splice(1), "~");
				
				_.forEach(textOptionObject.recipes, (value, key) => {
					if (key == keyId) {
						if (satisfiesFlagConditions(value.requiresFlag) && satisfiesItemConditions(value.requiresItem)) {
							matchResult = value;
							return false;
						}
					}
				});
			}
		});
		
		// find global text options
		_.forEach(this.model.globalOptions, textOptionObject => {
			const filter = new RegExp(textOptionObject.regex, "i");
			const match = input.match(filter);
			if (match) {
				let keyId = _.join(_.orderBy(match.splice(1), x => x.toLowerCase()), "~");
				
				_.forEach(textOptionObject.recipes, (value, key) => {
					if (key == keyId) {
						if (satisfiesFlagConditions(value.requiresFlag) && satisfiesItemConditions(value.requiresItem)) {
							matchResult = value;
							return false;
						}
					}
				});
			}
		});
		
		if (!_.isEmpty(matchResult)) {
			changeRoom(matchResult.destination);
			updateFlags(matchResult.modifyFlag);
			updateInventory(matchResult.modifyInventory);
			if (!_.isEmpty(matchResult.content)){
				return appendReactions(matchResult.content);
			} else {
				return printRoom();
			}
		} else {
			return appendReactions(this.model.messages.invalid);
		}
	};
	
	this.saveState = () => {
		return this.state;
	};
	
	this.saveStateToFile = (fileDir, errorFunction) => {
		fs.writeFile(fileDir, JSON.stringify(this.state, null, 2), errorFunction);
	};
	
	this.loadState = (newState) => {
		this.state = newState;
    return printRoom();
	};
	
	this.loadStateFromFile = (fileDir) => {
		let rawdata;
		try {
			rawdata = fs.readFileSync(fileDir);
		} catch (err) {
			return err;
		}
		this.state = JSON.parse(rawdata);
		return printRoom();
	};
	
	let satisfiesFlagConditions = (conditions) => {
		if (_.isEmpty(conditions)) {
			return true;
		}
		
		let condSatisfied = true;
		_.forEach(conditions, (value, key) => {
			if (this.state.globalFlags[key] !== value) {
				condSatisfied = false;
				return false;
			}
		});
		
		return condSatisfied;
	};
	
	let satisfiesItemConditions = (conditions) => {
		if (_.isEmpty(conditions)) {
			return true;
		}
		
		let condSatisfied = true;
		_.forEach(conditions, (value, key) => {
			if (this.state.inventory[key] < value) {
				condSatisfied = false;
				return false;
			}
		});
		
		return condSatisfied;
	};
	
	let updateFlags = (flags) => {
		_.forEach(flags, (value, key) => {
			this.state.globalFlags[key] = value;
		});
	};
	
	let updateInventory = (items) => {
		_.forEach(items, (value, key) => {
			if (_.isEmpty(this.state.inventory[key])) {
				this.state.inventory[key] = 0;
			}
			
			this.state.inventory[key] += value;
		});
	};
	
	let listInventory = () => {
		let returnObject = emptyPassagePayload();
		
		returnObject.content.text += "You look in your pockets and see the following: \n"
		let itemCount = 0;
		_.forEach(this.state.inventory, (value, key) => {
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
	
	let changeRoom = (roomId) => {
		if (_.isEmpty(roomId)) {
			return;
		}
		
		this.state.currentRoom = roomId;
		updateFlags(this.model.rooms[this.state.currentRoom].modifyFlag);
		updateInventory(this.model.rooms[this.state.currentRoom].modifyInventory);
	}
	
	let printRoom = () => {
		let resp = _.cloneDeep(this.model.rooms[this.state.currentRoom].content);
		
		return appendReactions(resp);
	}
	
	let appendReactions = (content) => {
		let resp = _.cloneDeep(content);
		resp.emoji = [];
		
		resp.text.push("");
		_.forEach(this.model.rooms[this.state.currentRoom].reactionOptions, (reactionObject) => {
			if (!satisfiesFlagConditions(reactionObject.requiresFlag)) {
				return;
			}
			if (!satisfiesItemConditions(reactionObject.requiresItem)) {
				return;
			}
			
			resp.emoji.push(reactionObject.emoji);
			resp.text.push(wrapEmoji(reactionObject.emoji) + ": " + reactionObject.summary);
		});
		
		return resp;
	}
	
	let wrapEmoji = (emoji) => {
		return ":" + emoji + ":";
	}
}

module.exports = GameInstance;
