var _ = require('lodash'); 

module.exports = {
	// input, verbModel -> parseResult
	parse: function(input, verbModel) {
		let returnObject = {};
		
		let verbId = 0;
		_.forEach(verbModel, (value) => {
			const filter = new RegExp(value.regex, "i");
			const match = input.match(filter);
			if(match) {
				returnObject.verb = value.name;
				returnObject.verbId = verbId;
				_.forEach(value.map, (mapValue, mapKey) => {
					returnObject[mapKey] = (mapValue === "verb" ? value.name : match[mapValue]);
				});
				if (_.has(value, "ignoreVerifyActor")) {
					returnObject.ignoreVerifyActor = value.ignoreVerifyActor;
				}
				return false;
			}
			verbId++;
		});
		
		return returnObject;
	},
	
	// parseResult, inventory, interactables -> bool
	verify: function(parseResult, inventory, interactables) {
		return inventory[parseResult.actor] || interactables[parseResult.actor] || parseResult.verb === parseResult.actor || parseResult.ignoreVerifyActor;
	}
}
