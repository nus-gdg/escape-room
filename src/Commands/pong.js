module.exports = {
  commands: [
    {
      command: "pong",
      example: "!pong",
      description: "Displays the lotency of the bot."
    }
  ],

  run: (client, message) => {
    message.channel.send("Peeng!");
  }
};
