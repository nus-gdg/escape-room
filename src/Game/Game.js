var _ = require('lodash'); 
var fs = require('fs');

var Parser = require("./ConditionParser.js");
var Passage = require("./PassageResolver.js");

function emptyPassagePayload() {
	return {
		"title": "",
		"text": [],
		"image": []
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
		let passages = Passage.resolve(this.model.rooms[this.state.currentRoom].passages, this.state.globalFlags, this.state.inventory);
		let reacts = _.find(passages.reactionOptions, x => x.emoji === input);
		
		handleModifies(reacts.modify);
		
		if (reacts.destination) {
			changeRoom(reacts.destination);
		}
		
		let prependPassage = [];
		if (!_.isEmpty(reacts.prepend)) {
			prependPassage = reacts.prepend;
		}
		return printRoom(prependPassage);
	};
	
	this.response = (input) => {
		if (input === "inventory") {
			return printRoom(listInventory());
		}
		
		let matchResult = {};
		
		let passages = Passage.resolve(this.model.rooms[this.state.currentRoom].passages, this.state.globalFlags, this.state.inventory);
		
		// find in room first
		_.forEach(passages.textOptions, textOptionObject => {
			const filter = new RegExp(textOptionObject.regex, "i");
			const match = input.match(filter);
			if (match) {
				let keyId = _.join(match.splice(1), "~");
				
				_.forEach(textOptionObject.recipes, (value, key) => {
					if (key == keyId) {
						if (Parser.parse(value.condition, this.state.globalFlags, this.state.inventory)) {
							matchResult = value;
							return false;
						}
					}
				});
			}
		});
		
		// find global text options
		_.forEach(this.model.globalTextOptions, textOptionObject => {
			const filter = new RegExp(textOptionObject.regex, "i");
			const match = input.match(filter);
			if (match) {
				let keyId = _.join(_.orderBy(match.splice(1), x => x.toLowerCase()), "~");
				
				_.forEach(textOptionObject.recipes, (value, key) => {
					if (key == keyId) {
						if (Parser.parse(value.condition, this.state.globalFlags, this.state.inventory)) {
							matchResult = value;
							return false;
						}
					}
				});
			}
		});
		
		if (!_.isEmpty(matchResult)) {
			changeRoom(matchResult.destination);
			handleModifies(matchResult.modify);
			
			if (matchResult.destination) {
				changeRoom(matchResult.destination);
			}
			
			let prependPassage = [];
			if (matchResult.prepend) {
				prependPassage = matchResult.prepend;
			}
			
			return printRoom(prependPassage);
		} else {
			return printRoom(this.model.messages.invalid);
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
	
	this.resetSaveFile = (fileDir) => {
		fs.unlinkSync(fileDir);
	};
	
	let handleModifies = (modify) => {
		if (_.isEmpty(modify)) {
			return;
		}
		
		updateFlags(modify.modifyFlag);
		updateInventory(modify.modifyInventory);
	}
	
	let updateFlags = (flags) => {
		_.forEach(flags, (value, key) => {
			this.state.globalFlags[key] = value;
		});
	};
	
	let updateInventory = (items) => {
		_.forEach(items, (value, key) => {
			if (typeof this.state.inventory[key] !== "number") {
				this.state.inventory[key] = 0;
			}
			
			this.state.inventory[key] += value;
		});
	};
	
	let listInventory = () => {
		let returnObject = [];
		let passageZero = {};
		passageZero.text = []
		returnObject.push(passageZero);
		
		passageZero.text.push("You look in your pockets and see the following:");
		let itemCount = 0;
		_.forEach(this.state.inventory, (value, key) => {
			if (value > 0) {
				itemCount++;
				passageZero.text.push(`  - ${key}: ${value}`);
			}
		});
		if (itemCount === 0) {
			passageZero.text.push("  - a whole lot of nothing");
		}
		
		return returnObject;
	};
	
	let changeRoom = (roomId) => {
		if (_.isEmpty(roomId)) {
			return;
		}
		
		this.state.currentRoom = roomId;
		handleModifies(this.model.rooms[this.state.currentRoom].modify);
	}
	
	let printRoom = (prependPassage) => {
		let appendReactions = (r) => {
			let resp = _.cloneDeep(r);
			resp.emoji = [];
			
			resp.text.push("");
			_.forEach(passages.reactionOptions, (reactionObject) => {
				resp.emoji.push(reactionObject.emoji);
				resp.text.push(wrapEmoji(reactionObject.emoji) + ": " + reactionObject.summary);
			});
			
			return resp;
		}
		
		let resp = emptyPassagePayload();
		
		let passages = Passage.resolve(this.model.rooms[this.state.currentRoom].passages, this.state.globalFlags, this.state.inventory);
		
		let prepend = Passage.resolve(prependPassage, this.state.globalFlags, this.state.inventory);
		
		resp.title = this.model.rooms[this.state.currentRoom].title;
		resp.text = _.isEmpty(prependPassage) ? passages.text : prepend.text.concat("", passages.text);
		resp.image = passages.image;
		
		return appendReactions(resp);
	}
	
	let wrapEmoji = (emoji) => {
		return ":" + emoji + ":";
	}
}

module.exports = GameInstance;
