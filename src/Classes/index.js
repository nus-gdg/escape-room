const Discord = require("discord.js");

module.exports = loadDiscordClasses();

async function loadDiscordClasses() {
  return new Promise(async resolve => {
    resolve(Discord);
  });
}
