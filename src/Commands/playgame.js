// In JavaScript, classes are closures. Thus, setupGame 
// can be seen as a class. 
const setupGame2 = (client, message, args) => {
  if (typeof client.variables.channelList.playgame === "undefined") {
    client.variables.channelList.playgame = [];
  }
  
  if (client.variables.channelList.playgame.includes(message.channel.id)) {
    message.channel.send("This channel is taken nya!");
    return;
  }
  client.variables.channelList.playgame.push(message.channel.id);
  
  let currentValue = 5;
  let messageId = null;
  let currentChannel = message.channel.id;
  message.channel.send(currentValue).then((sent) => {
    messageId = sent.id;
    runGameLogic(client, sent);
  });
  
  // Here, this refers to the setupGame class
  const refreshMessage = (client, message) => {
    message.edit(currentValue);
  }

  const updateGameMessage = function(messageReaction, user) {
    if (!user.bot) {
      if (messageId == messageReaction.message.id) {
        let hasStopped = false;
        switch (messageReaction.emoji.toString()) {
          case "⬅️":
            currentValue--;
            break;
          case "➡️":
            currentValue++;
            break;
          case "❌":
            messageReaction.message.reactions.removeAll();
            hasStopped = true;
            this.emit("stop", messageReaction.message.channel.id, "playgame");
            break;
          default:
            break;
        }
        messageReaction.users.remove(user);
        if (!hasStopped) {
          refreshMessage(this, messageReaction.message);
        }
      }
    }
  }

  const runGameLogic = (client, message) => {
    message.react("⬅️");
    message.react("➡️");
    message.react("❌");
    /*
    let activeMessageID = client.variables.gameLogic.currentMessage;
    message.channel.messages.fetch(activeMessageID)
      .then(message => {
      
    })*/
  }
  
  client.on("messageReactionAdd", updateGameMessage);
  client.on("stop", (channelId, module) => {
    if ((channelId === currentChannel) && (module === "playgame")) {
      client.variables.channelList.playgame.splice(
        client.variables.channelList.playgame.indexOf(channelId), 1);
      client.removeListener("messageReactionAdd", updateGameMessage);
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