module.exports = {
  commands: [
    {
      command: "play",
      example: "nyan! play",
      description: "Plays a test game."
    }
  ],

  run: (client, message, args) => {
    client.variables.state = "playing";
    client.variables.gameLogic = {};
    client.variables.gameLogic.currentValue = 0;
    client.variables.gameLogic.currentMessage = null;
    message.channel.send(client.variables.gameLogic.currentValue)
  }
};