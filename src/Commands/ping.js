module.exports = {
  commands: [
    {
      command: "ping",
      example: "nyan! ping",
      description: "Displays the current state of the bot."
    }
  ],

  run: (client, message) => {
	message.channel.send("I'm " + client.variables.state + " nya!");
  }
};
