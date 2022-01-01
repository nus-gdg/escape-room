const refreshMessage = (client, message) => {
  message.edit(client.variables.gameLogic.currentValue);
}

const updateGameMessage = (client, messageReaction, user) => {
  if (!user.bot) {
    if (client.variables.gameLogic.currentMessage == 
      messageReaction.message.id) {
      switch (messageReaction.emoji.toString()) {
        case "⬅️":
          client.variables.gameLogic.currentValue--;
          break;
        case "➡️":
          client.variables.gameLogic.currentValue++;
          break;
        case "❌":
          messageReaction.message.reactions.removeAll();
          client.variables.state = "ready";
          break;
        default:
          break;
      }
      messageReaction.users.remove(user);
      if (client.variables.state == "playing") {
        refreshMessage(client, messageReaction.message);
      }
    }
  }
}

module.exports = (client, messageReaction, user) => {
  if (client.variables.state == "playing") {
    updateGameMessage(client, messageReaction, user);
  }
};
