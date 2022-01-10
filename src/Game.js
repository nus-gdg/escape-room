const readline = require('readline');
const readlineInterface = readline.createInterface(process.stdin, process.stdout);

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

function formatPrompt(prompt) {
  return `\n${prompt}\n`;
}

function formatOption(option, i) {
  return `[${i}] ${option}`;
}

const msg_welcome = "Welcome!";
const msg_goodbye = "Goodbye!";

const prompt_continue = "Press <ENTER> to continue...";
const prompt_chooseOption = "What would you like to do?";

const desc_room = [
  "You are trapped...",
  "",
  "On the left, you see an sink.",
  "Beside it, there is a safe.",
  "On your right, there are stairs leading to a second floor.",
]

const options_room = [
  "Go to sink.",
  "Go to safe.",
  "Go upstairs.",
]

const state = {
  "hasString": false,
  "hasUnlockedSafe": false,
  "hasMagnet": false,
  "combinedMagnetAndString": false,
  "hasKey": false,
}

function promptContinue() {
  return ask(formatPrompt(prompt_continue));
}

async function promptChooseOption(options) {
  let fullPrompt = prompt_chooseOption;

  options.forEach((option, i) => {
    fullPrompt += "\n";
    fullPrompt += formatOption(option, i + 1);
  });

  return ask(formatPrompt(fullPrompt));
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
  clearLog();
  displayLines(desc_room);
  let option = await promptChooseOption(options_room);

  clearLog();
  displayLine(`You have chosen to ${options_room[option - 1]}!`);
  await promptContinue();
}

async function run() {
  await setup();
  await play();
  await teardown();
  process.exit();
}

run();
