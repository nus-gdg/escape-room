const runGameLogic = (client, message) => {
  if (client.variables.gameLogic.currentMessage === null) {
    client.variables.gameLogic.currentMessage = message.id;
    message.react("⬅️");
    message.react("➡️");
    message.react("❌");
  }
  /*
  let activeMessageID = client.variables.gameLogic.currentMessage;
  message.channel.messages.fetch(activeMessageID)
    .then(message => {
	  
	})*/
}

module.exports = (client, message) => {
  const args = message.content.split(" ");

  message.member.checkRoles();
  
  switch (client.variables.state) {
    case "playing":
      runGameLogic(client, message);
      break;
    default:
      break;
  }

  if (message.author.bot) return;

  let commandHandlerCheck = client.config.prefixSeperated
    ? args[0].toLowerCase() !== client.config.prefix.toLowerCase()
    : !message.content.startsWith(client.config.prefix.toLowerCase());
  if (commandHandlerCheck) return;
  
  if (!message.channel.is.escaperoom && !message.channel.is.testing) {
    return;
  }

  let cmd = client.config.prefixSeperated
    ? args[1].toLowerCase()
    : args[0].toLowerCase().substring(client.config.prefix.length);
  if (!client.commands[cmd]) {
    message.channel.send("UwU, I don't know what " + cmd + " means :<");
    return;
  };

  client.commands[cmd].run(client, message, args);
};
