const name_to_emoji = require("emoji-name-map");
const emoji_to_name = {};

for (let key in name_to_emoji.emoji) {
  emoji_to_name[name_to_emoji.get(key)] = key;
}

const parseMessages = (contentObject) => {
  let imageUrl = "";
  if (contentObject.image[0] !== null) {
    imageUrl = contentObject.image[0];
  }
  return {
    embed: {
      title: "I don't know what to put here",
      description: contentObject.text.join("\r\n"), 
      color: 0x0099ff,
      image: {url: imageUrl},
    }
  }
}

class SampleGame {
  constructor() {
    this.currentValue = 0;
  }
  
  start() {
    this.currentValue = 0;
    return {
      "text": ["Welcome!", 
        "Current State: " + this.currentValue,
        "",
        ":arrow_left: decrease by 1",
        ":arrow_right: increase by 1", 
        ":x: exit"], // array of decsriptions
      "image": [], // arrray of url
      "emoji": [
        ":arrow_left:",
        ":arrow_right:",
        ":x:"
      ], // emoji, for reactions
      "flags": [""]
    }
  }
  
  response(text) {
  }

  react(emoji) {
    let hasStopped = "";
    switch (emoji) {
      case ":arrow_left:":
        this.currentValue--;
        break;
      case ":arrow_right:":
        this.currentValue++;
        break;
      case ":x:":
        hasStopped = "stop";
        break;
      default:
        break;
    }
    return {
      "text": ["Current State: " + this.currentValue,
        "",
        ":arrow_left: decrease by 1",
        ":arrow_right: increase by 1", 
        ":x: exit"], // array of decsriptions
      "image": [], // arrray of url
      "emoji": [
        ":arrow_left:",
        ":arrow_right:",
        ":x:"
      ], // emoji, for reactions
      "flags": [hasStopped]
    }
  }
}

const Goodbye = {
  embed: {
    title: "Sayonyara~ :cat:",
    description: "Hope to see you soon!", 
    color: 0xffffff,
    image: {url: "https://i.imgur.com/DKT4tjt.gif"}
  }
}

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
  
  let currentMessage = null;
  let currentChannel = message.channel.id;
  let currentGame = new SampleGame();
  
  // TODO: remove race conditions, make this thread safe
  // What would happen if someone passes an invalid emoji? 
  const postState = (contentObject) => {
    /*
    if (currentMessage !== null) {
      currentMessage.reactions.removeAll();
    }*/
    if (contentObject.flags.includes("stop")) {
      client.emit("stop", currentChannel, "playgame");
      message.channel.send(Goodbye);
      return;
    }
    
    let parsedMessage = parseMessages(contentObject);
    message.channel.send(parsedMessage).then((sent) => {
      currentMessage = sent;
      for (let emoji of contentObject.emoji) {
        sent.react(name_to_emoji.get(emoji));
      }
    });
  }
  
  postState(currentGame.start());

  const updateGameState = function(messageReaction, user) {
    if (!user.bot) {
      if (currentMessage.id == messageReaction.message.id) {
        postState(currentGame.react(":" 
          + emoji_to_name[messageReaction.emoji.toString()] + ":"));
      }
    }
  }
  
  client.on("messageReactionAdd", updateGameState);
  client.on("stop", (channelId, module) => {
    if ((channelId === currentChannel) && (module === "playgame")) {
      client.variables.channelList.playgame.splice(
        client.variables.channelList.playgame.indexOf(channelId), 1);
      client.removeListener("messageReactionAdd", updateGameState);
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