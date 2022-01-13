var Game = require("./Game.js");

let gameInstance = new Game("test.json");
console.log(gameInstance.interact("use iron key on door"));
console.log(gameInstance.interact("use magnet on a string on sink"));
console.log(gameInstance.interact("take yarn"));
console.log(gameInstance.interact("list verbs"));
console.log(gameInstance.interact("look at cabinet"));
console.log(gameInstance.interact("open cabinet"));
console.log(gameInstance.interact("take yarn"));
console.log(gameInstance.interact("look under sink"));
console.log(gameInstance.interact("go to upstairs"));
console.log(gameInstance.interact("look at bed"));
console.log(gameInstance.interact("look under bed"));
console.log(gameInstance.interact("look at safe"));
console.log(gameInstance.interact("enter 1984 into safe"));
console.log(gameInstance.interact("take magnet"));
console.log(gameInstance.interact("take magnet"));
console.log(gameInstance.interact("go to downstairs"));
console.log(gameInstance.interact("inventory"));
console.log(gameInstance.interact("use magnet on yarn"));
console.log(gameInstance.interact("use magnet on a string on sink"));
console.log(gameInstance.interact("use iron key on door"));

