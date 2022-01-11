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

const msg_line = "*".repeat(10);
const msg_welcome = "Welcome!";
const msg_win = [
  "CONGRATULATIONS!",
  "",
  "You have ESCAPED!"
];
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

function display(value) {
  if (Array.isArray(value)) {
    console.log(value.join('\n'));
  } else {
    console.log(value);
  }
}

function clear() {
  console.clear();
}

function debug(value, header = "") {
  console.log(header);
  console.dir(value, { "depth": null });
  console.log(msg_line);
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
  clear();

  await Promise.all([
    loadLevels(),
  ]);

  display(msg_welcome);

  await promptContinue();
}

async function teardown() {
  clear();
  display(msg_goodbye);
}

async function play() {
  let level = levels.level1;
  let currentState = deepcopy(level.initialState);
  let currentRoom = level.rooms[level.initialRoom];
  let previousRoom = level.rooms[level.initialRoom];

  while (true) {
    clear();

    if (currentState.escaped) {
      display(msg_win);
      await promptContinue();
      return;
    }

    debug(currentState, "STATE");
    debug(currentRoom, "ROOM");

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
