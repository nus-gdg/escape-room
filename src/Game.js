const readline = require('readline');
const readlineInterface = readline.createInterface(process.stdin, process.stdout);

const msg_welcome = "Welcome!";
const msg_goodbye = "Goodbye!";

const prompt_continue = "Press <ENTER> to continue...";
const prompt_chooseOption = "What would you like to do?";

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

function clearLog() {
  console.clear();
}

function displayLine(message) {
  console.log(message);
}

function displayLines(messages) {
  console.log(messages.join('\n'));
}

function displayDebug(state, room) {
  console.log(state);
  console.log(room.options);
}

const state = {
  "foundString": false,
  "unlockedSafe": false,
  "foundMagnet": false,
  "foundMagnetAndString": false,
  "foundKey": false,
}

const rooms = {
  "main": {
    "description": [
      "You are trapped...",
      "",
      "On the left, you see an sink.",
      "Beside it, there is a safe.",
      "On your right, there are stairs leading to a second floor.",
    ],
    "modifies": {},
    "options": [
      {
        "summary": "Go to sink.",
        "destination": "sink",
        "requires": {},
      },
      {
        "summary": "Go to safe.",
        "destination": "main",
        "requires": {},
      },
      {
        "summary": "Go upstairs.",
        "destination": "main",
        "requires": {},
      },
    ],
  },
  "sink": {
    "description": [
      "You approach the small sink squeezed in a corner of the room."
    ],
    "modifies": {},
    "options": [
      {
        "summary": "Look inside the sink.",
        "destination": "sink_hole",
        "requires": {},
      },
      {
        "summary": "Look under the sink.",
        "destination": "sink_hole",
        "requires": {},
      },
      {
        "summary": "Back.",
        "destination": "main",
        "requires": {},
      },
    ],
  },
  "sink_hole": {
    "description": [
      "Water drips from the sink tap like a clock,",
      "chiming as the droplets spatter on the metallic surface."
    ],
    "modifies": {},
    "options": [
      {
        "summary": "Inspect sink hole.",
        "destination": "sink_hole_plugged",
        "requires": {
          "foundKey": false,
        },
      },
      {
        "summary": "Unplug sink hole.",
        "destination": "sink_hole_unplugged",
        "requires": {
          "foundKey": false,
          "foundMagnetAndString": true,
        },
      },
      {
        "summary": "Back.",
        "destination": "sink",
        "requires": {},
      },
    ],
  },
  "sink_hole_plugged": {
    "description": [
      "There seems to be something shiny peeking out of the dark hole and out of your reach."
    ],
    "modifies": {},
    "options": [
      {
        "summary": "Continue.",
        "destination": "sink_hole",
        "requires": {},
      },
    ],
  },
  "sink_hole_unplugged": {
    "description": [
      "You retrieve a tiny key from the sink hole.",
    ],
    "modifies": {
      "foundKey": true,
    },
    "options": [
      {
        "summary": "Continue.",
        "destination": "sink_hole",
        "requires": {},
      },
    ],
  },
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
  clearLog();
  displayLine(msg_welcome);
  await promptContinue();
}

async function teardown() {
  clearLog();
  displayLine(msg_goodbye);
}

async function play() {
  let currentState = deepcopy(state);
  let currentRoom = rooms["main"];

  while (true) {
    clearLog();

    displayDebug(currentState, currentRoom);
    displayLines(currentRoom.description);

    const validOptions = getValidOptions(currentState, currentRoom.options);
    let option = await promptChooseOption(currentState, validOptions);

    currentRoom = rooms[option.destination];
    Object.assign(currentState, currentRoom.modifies);
  }
}

async function run() {
  await setup();
  await play();
  await teardown();
  process.exit();
}

run();
