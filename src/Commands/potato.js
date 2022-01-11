module.exports = {
  commands: [
    {
      command: "potato",
      example: "!potato",
      description: "Bots love taters."
    }
  ],

  run: (client, message) => {
    message.channel.send({
      embed: {
        title: "Wots tayters, precious?!",
        color: 0x0099ff,
        image: {url: "https://i.redd.it/v6yngoukdyo51.jpg"},
      }
    });
  }
};
