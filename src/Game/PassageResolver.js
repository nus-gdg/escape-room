var _ = require('lodash'); 

module.exports = {
	// passageList -> passageResp
	resolve: function(passageList, vars, inventory) {
		let returnObject = {
			"payload": {
				"content": {
					"text": "",
					"image": []
				}
			},
			"isEmpty": true,
			"flagChanges": {},
			"addInventory": [],
			"removeInventory": []
		};
		let contentText = "";
		let contentImage = [];
		
		_.forEach(passageList, (passage) => {
			function flagChangeHandler(p) {
				_.forEach(p?.setFlag, (flag) => {
					returnObject.flagChanges[flag] = true;
				});
				_.forEach(p?.unsetFlag, (flag) => {
					returnObject.flagChanges[flag] = false;
				});
			}
			function roomChangeHandler(p) {
				returnObject.roomChange = p?.changeRoom;
			}
			function addContentHandler(p) {
				returnObject.addContent = p?.addContent;
			}
			function addInventoryHandler(p) {
				_.forEach(p?.addInventory, (item) => {
					returnObject.addInventory.push(item);
				});
			}
			function removeInventoryHandler(p) {
				_.forEach(p?.removeInventory, (item) => {
					returnObject.removeInventory.push(item);
				});
			}
			
			let conditionSatisfied = true;
			
			// check flag conditions
			if (_.has(passage, "condition")) {				
				_.forEach(passage.condition, (conditionValue, conditionKey) => {
					if (vars[conditionKey] !== conditionValue && inventory[conditionKey] !== conditionValue) {
						conditionSatisfied = false;
						return;
					}
				});
			}
			
			// handle content
			if (!conditionSatisfied) {
				contentText += passage.altContent?.text ? (passage.altContent.text + "\n") : "";
				if (passage.altContent?.image) {
					contentImage.push(...passage.altContent.image);
				}
				flagChangeHandler(passage.altContent);
				roomChangeHandler(passage.altContent);
				addContentHandler(passage.altContent);
				addInventoryHandler(passage.altContent);
				removeInventoryHandler(passage.altContent);
			} else {
				contentText += passage.content?.text ? (passage.content.text + "\n") : "";
				if (passage.content?.image) {
					contentImage.push(...passage.content.image);
				}
				flagChangeHandler(passage.content);
				roomChangeHandler(passage.content);
				addContentHandler(passage.content);
				addInventoryHandler(passage.content);
				removeInventoryHandler(passage.content);
			}
		});
		
		
		if (!_.isEmpty(contentText)) {
			returnObject.payload.content.text = contentText;
			returnObject.isEmpty = false;
		}
		
		if (!_.isEmpty(contentImage)) {
			returnObject.payload.content.image = contentImage;
			returnObject.isEmpty = false;
		}
		
		return returnObject;
	}
}
