const setupTest = (client, message, args) => {
  let messageId = message.id;
  let currentMessage = args[2];
  client.on("call_test", (args) => {
    args = args[2];
    if (typeof args !== "undefined") currentMessage = args;
    message.channel.send(messageId + ", " + currentMessage);
  });
}

module.exports = {
  commands: [
    {
      command: "test",
      example: "nyan! test",
      description: "Because Hagu cannot write a closure to save his life"
    }
  ],

  run: (client, message, args) => {
    setupTest(client, message, args);
    client.emit("call_test", args);
  }
};