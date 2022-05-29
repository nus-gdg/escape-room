var _ = require('lodash'); 


function parse(condition, vars, inventory) {
	if (_.isEmpty(condition)) {
		return true;
	}
	
	if (typeof condition === "string") {
		return vars[condition] ?? inventory[condition];
	}
	
	if (typeof condition === "number") {
		return condition;
	}
	
	switch (condition.op){
		case "==":
			return parse(condition.value, vars, inventory) == parse(condition.value2, vars, inventory);
		case "<":
			return parse(condition.value, vars, inventory) < parse(condition.value2, vars, inventory);
		case "<=":
			return parse(condition.value, vars, inventory) <= parse(condition.value2, vars, inventory);
		case ">":
			return parse(condition.value, vars, inventory) > parse(condition.value2, vars, inventory);
		case ">=":
			return parse(condition.value, vars, inventory) >= parse(condition.value2, vars, inventory);
		case "&&":
			return parse(condition.value, vars, inventory) && parse(condition.value2, vars, inventory);
		case "||":
			return parse(condition.value, vars, inventory) || parse(condition.value2, vars, inventory);
	}
}

module.exports.parse = parse;