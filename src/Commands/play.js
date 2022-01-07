// In JavaScript, classes are closures. Thus, setupGame 
// can be seen as a class. 
const setupGame = async function(client, message, args) {
  if (typeof this.channelList === "undefined") {
    this.channelList = [];
  }
  
  if (this.channelList.includes(message.channel.id)) {
    message.channel.send("This channel is taken nya!");
    return;
  }
  this.channelList.push(message.channel.id);
  
  let currentValue = 0;
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

  const updateGameMessage = (client, messageReaction, user) => {
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
            client.emit("stop", messageReaction.message.channel.id);
            break;
          default:
            break;
        }
        messageReaction.users.remove(user);
        if (!hasStopped) {
          refreshMessage(client, messageReaction.message);
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
  
  const f1 = (messageReaction, user) => {
    updateGameMessage(client, messageReaction, user);
  }
  
  client.on("messageReactionAdd", f1);
  client.on("stop", (channelId) => {
    if (channelId === currentChannel) {
      this.channelList.splice(this.channelList.indexOf(channelId), 1);
      client.removeListener("messageReactionAdd", f1);
      client.removeListener("stop", arguments.callee);
    }
  });
}

module.exports = {
  commands: [
    {
      command: "play",
      example: "nyan! play",
      description: "Plays a test game."
    }
  ],

  run: (client, message, args) => {
    setupGame(client, message, args);
  }
};