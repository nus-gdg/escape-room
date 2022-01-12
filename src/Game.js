"use strict";
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const readline = require('readline');
const readlineInterface = readline.createInterface(process.stdin, process.stdout);

const path_data = path.join(__dirname, "Levels");

const msg_welcome = "Welcome!";
const msg_win = "CONGRATULATIONS!\n\nYou have ESCAPED!";
const msg_goodbye = "Goodbye!";

const prompt_continue = "Press <ENTER> to continue...";
const prompt_chooseOption = "What would you like to do?";

const listener = new EventEmitter();

function readDataSync(directory, onFileContent) {
  fs.readdirSync(directory).forEach((filename) => {
      const fileInfo = path.parse(filename);
      const filepath = path.resolve(directory, filename);
      const rawdata = fs.readFileSync(filepath);
      onFileContent(fileInfo.name, fileInfo.ext, rawdata);
  })
}

function deepcopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function equals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function formatWithPadding(message) {
  return `\n${message}\n`;
}

function formatAsMenu(options, header = prompt_chooseOption) {
  let menu = header;

  for (const [i, option] of Object.entries(options)) {
    menu += `\n[${parseInt(i) + 1}] ${option.summary}`;
  };

  return menu;
}

function ask(query = "") {
  return new Promise((resolve, reject) => {
    readlineInterface.question(query, resolve);
  });
}

function displayLine(message) {
  console.log(message);
}

function displayLines(messages) {
  console.log(messages.join('\n'));
}

function displayDebug(state, room) {
  console.log("[ DEBUG ]===\n");

  console.log("State:");
  console.log(state);

  console.log("Room Options:");
  console.log(room.options);

  console.log("\n===========\n");
}

let levels = {};

function loadLevels() {
  levels = {};
  readDataSync(path_data, (name, ext, rawdata) => {
    levels[name] = JSON.parse(rawdata);
  });
}

function hasRequirements(state, requires) {
  for (const [req, value] of Object.entries(requires)) {
    if (!state.hasOwnProperty(req) || state[req] !== value) {
      return false;
    }
  }
  return true;
}

function getValidOptions(state, options) {
  let validOptions = [];
  for (const option of options) {
    if (!hasRequirements(state, option.requires)) {
      continue;
    }
    validOptions.push(option);
  }
  return validOptions;
}

function promptContinue() {
  return ask(formatWithPadding(prompt_continue));
}

function promptChooseOption(state, options) {
  return ask(formatWithPadding(formatAsMenu(options)))
    .then((optionIndex) => {
      return options[optionIndex - 1];
    });
}

async function setup() {
  loadLevels();

  displayLine(msg_welcome);
  await promptContinue();
}

async function teardown() {
  displayLine(msg_goodbye);
}

class GameState {
  constructor() {
    this.level = levels.level1;
    this.currentState = deepcopy(this.level.initialState);
    this.currentRoom = this.level.rooms[this.level.initialRoom];
    this.previousRoom = this.level.rooms[this.level.initialRoom]; 
    this.validOptions = getValidOptions(this.currentState, 
      this.currentRoom.options);
  }
  
  response(option) {
    if (this.validOptions.length > 0) {
      this.previousRoom = this.currentRoom;
      this.currentRoom = this.level.rooms[option.destination];
      Object.assign(this.currentState, this.currentRoom.modifies);
    } else {
      this.currentRoom = this.previousRoom;
    }
    
    if (this.currentState.escaped) {
      displayLine(msg_win);
      return true;
    }
    
    this.validOptions = getValidOptions(this.currentState, 
      this.currentRoom.options);
    
    displayDebug(this.currentState, this.currentRoom);
    displayLines(this.currentRoom.description);
    return false;
  }
}

async function play() {
  let game = new GameState();
  
  let response = null;
  while (true) {
    if (game.validOptions.length > 0) {
      response = await promptChooseOption(null, game.validOptions);
    } else {
      await promptContinue();
      response = null;
    }
    if (game.response(response)) {
      return;
    }
  }
}

async function run() {
  await setup();
  await play();
  await teardown();
  process.exit();
}


// To do: add a listener. Hook should add in listeners first

module.exports = {
  run : run,
  listener : listener
};