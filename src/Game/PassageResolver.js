var _ = require('lodash'); 
var Parser = require("./ConditionParser.js");

module.exports = {
	resolve: function(passageList, vars, inventory) {
		let returnObject = {
			"text": [],
			"image": [],
			"reactionOptions": [],
			"textOptions": []
		};
		
		_.forEach(passageList, passage => {
			if (_.isEmpty(passage.condition) || Parser.parse(passage.condition, vars, inventory)) {
				_.forEach(passage.text, text => {
					returnObject.text.push(text);
				});
				_.forEach(passage.image, image => {
					returnObject.image.push(image);
				});
				_.forEach(passage.reactionOptions, reactionOptions => {
					returnObject.reactionOptions.push(reactionOptions);
				});
				_.forEach(passage.textOptions, textOptions => {
					returnObject.textOptions.push(textOptions);
				});
			}
		});
		
		return returnObject;
	}
}
