var Game = require("../Game/Game.js");
var path = require("path");
var { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");

const name_to_emoji = require("emoji-name-map");
const emoji_to_name = {};

for (let key in name_to_emoji.emoji) {
  emoji_to_name[name_to_emoji.get(key)] = key;
}

const parseMessages = (contentObject) => {
  let imageUrl = "";
  let newMessages = [];
  
  if (contentObject.image !== undefined) {
    if (contentObject.image[0] !== null) {
      imageUrl = contentObject.image[0];
    }
  }
  
  for (let message of contentObject.text) {
    let newMessage = message.replace(/<b>|<\/b>/g, "**");
    newMessages.push(newMessage);
  }
  
  let embed = new MessageEmbed();
  embed.setTitle(contentObject.title);
  if (imageUrl !== "") {
    embed.setImage(imageUrl);
  }
  embed.setDescription(newMessages.join("\r\n"));
  embed.setColor(0x0099ff);
  
  let buttonList = new MessageActionRow();
  for (let emoji of contentObject.emoji) {
    buttonList.addComponents(
      new MessageButton()
        .setCustomId(emoji)
        .setStyle("PRIMARY")
        .setEmoji(name_to_emoji.get(emoji))
    );
  }
  
  return {
    embeds: [embed], 
    components: [buttonList]
  }
}

const Goodbye = {
  embeds: [
    new MessageEmbed()
      .setTitle("Sayonyara~ :cat:")
      .setImage("https://i.imgur.com/DKT4tjt.gif")
      .setDescription("Hope to see you soon!")
      .setColor(0xffffff)
  ]
};

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
  let currentGame = new Game(path.join(__dirname, "../Game/testv2.json"));
  
  // TODO: remove race conditions, make this thread safe
  const postState = (contentObject) => {
    if (contentObject.flags !== undefined) {
      if (contentObject.flags.includes("stop")) {
        client.emit("stop", currentChannel, "playgame");
        message.channel.send(Goodbye);
        return;
      }
    }
    
    let parsedMessage = parseMessages(contentObject);
    message.channel.send(parsedMessage).then((sent) => {
      currentMessage = sent;
    });
  }
  
  const getFilePath = () => {
    return "savedata/" + currentChannel + ".json";
  }
  
  try {
    postState(currentGame.loadStateFromFile(getFilePath()));
  } catch (err) {
    postState(currentGame.start());
  }

  const sendReaction = async function(interaction) {
    if (interaction.type !== "MESSAGE_COMPONENT") return;
    if (currentMessage.id === interaction.message.id) {
      postState(currentGame.react(interaction.customId));
      currentGame.saveStateToFile(getFilePath(), 
        (e) => {console.log(e)});
      interaction.deferUpdate();
    }
  }
  
  const sendMessage = function(message) {
    if (!message.author.bot) {
	  if (message.content.startsWith(client.config.prefix)) {
		return;
	  }
      if (message.content === "quit") {
        client.emit("stop", currentChannel, "playgame");
        message.channel.send(Goodbye);
        return;
      }
      if (message.content === "really reset") {
		currentGame.resetSaveFile(getFilePath());
        client.emit("stop", currentChannel, "playgame");
        message.channel.send(Goodbye);
        return;
      }
      if (message.channel.id == currentChannel) {
        postState(currentGame.response(message.content));
        currentGame.saveStateToFile(getFilePath(), 
          (e) => {console.log(e)});
      }
    }
  }
  
  client.on("interactionCreate", sendReaction);
  client.on("messageCreate", sendMessage);
  client.on("stop", (channelId, module) => {
    if ((channelId === currentChannel) && (module === "playgame")) {
      client.variables.channelList.playgame.splice(
        client.variables.channelList.playgame.indexOf(channelId), 1);
      client.removeListener("interactionCreate", sendReaction);
      client.removeListener("messageCreate", sendMessage);
      client.removeListener("stop", arguments.callee);
    }
  });
}

module.exports = {
  commands: [
    {
      command: "play",
      example: "nyan! play",
      description: "Starts up the escape room game."
    }
  ],

  run: (client, message, args) => {
    setupGame2(client, message, args);
  }
};