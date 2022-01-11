"use strict";
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const readlineInterface = readline.createInterface(process.stdin, process.stdout);
const input = readlineInterface[Symbol.asyncIterator]();

readlineInterface.on("SIGINT", () => {
  process.exit();
});

const path_data = "Levels";

const msg_welcome = "Welcome!";
const msg_win = "CONGRATULATIONS!\n\nYou have ESCAPED!";
const msg_goodbye = "Goodbye!";
const msg_continue = "Press <ENTER> to continue...";
const msg_chooseOption = "What would you like to do?";
const msg_invalidOption = "Nothing interesting happens...";

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

function formatWithPadding(value) {
  return [
    "",
    value,
    "",
  ];
}

function formatAsMenu(options, header = "") {
  let menu = header;

  for (const [i, option] of Object.entries(options)) {
    menu += `\n[${parseInt(i) + 1}] ${option.summary}`;
  };

  return menu;
}

function ask(query = "", ) {
  return new Promise((resolve, reject) => {
    readlineInterface.question(query, (input) => {
      resolve(input);
    });
  });
  readlineInterface.question(query, (input) => {
    resolve(input);
  });
}

function clearLog() {
  console.clear();
}

function displayLine(message) {
  console.log(message);
}

function display(value) {
  if (Array.isArray(value)) {
    console.log(value.join('\n'));
  } else {
    console.log(value);
  }
}

function clearDisplay() {
  console.clear();
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

async function loadLevels() {
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

async function promptContinue() {
  display(formatWithPadding(msg_continue));
  await input.next();
}

async function promptChooseOption(state, options) {
  while (true) {
    display(
      formatWithPadding(
        formatAsMenu(options, msg_chooseOption)));

    let answer = await input.next();
    let index = answer.value - 1;

    if (options.hasOwnProperty(index)) {
      return options[index];
    } else {
      display(
        formatWithPadding(msg_invalidOption));
    }
  }
}

async function setup() {
  clearLog();

  await Promise.all([
    loadLevels(),
  ]);

  displayLine(msg_welcome);

  await promptContinue();
}

async function teardown() {
  clearLog();
  displayLine(msg_goodbye);
}

async function play() {
  let level = levels.level1;
  let currentState = deepcopy(level.initialState);
  let currentRoom = level.rooms[level.initialRoom];
  let previousRoom = level.rooms[level.initialRoom];

  while (true) {
    clearLog();

    if (currentState.escaped) {
      display(msg_win);
      await promptContinue();
      return;
    }

    displayDebug(currentState, currentRoom);
    display(currentRoom.description);

    const validOptions = getValidOptions(currentState, currentRoom.options);

    if (validOptions.length > 0) {
      let option = await promptChooseOption(currentState, validOptions);
      previousRoom = currentRoom;
      currentRoom = level.rooms[option.destination];
      Object.assign(currentState, currentRoom.modifies);

    } else {
      await promptContinue();
      currentRoom = previousRoom;
    }
  }
}

async function run() {
  await setup();
  await play();
  await teardown();
  process.exit();
}

run();
