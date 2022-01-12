const game = require("../Game.js")

const setupGame2 = (client, message, args) => {
  if (typeof client.variables.channelList.playgame === "undefined") {
    client.variables.channelList.playgame = [];
  }
  
  game.run()
  
  if (client.variables.channelList.playgame.includes(message.channel.id)) {
    message.channel.send("This channel is taken nya!");
    return;
  }
  client.variables.channelList.playgame.push(message.channel.id);
  
  client.on("stop", (channelId, module) => {
    if ((channelId === currentChannel) && (module === "playgame")) {
      client.variables.channelList.playgame.splice(
        client.variables.channelList.playgame.indexOf(channelId), 1);
      client.removeListener("stop", arguments.callee);
    }
  });
}

module.exports = {
  commands: [
    {
      command: "playgame",
      example: "nyan! playgame",
      description: "Starts up the escape room game."
    }
  ],

  run: (client, message, args) => {
    setupGame2(client, message, args);
  }
};