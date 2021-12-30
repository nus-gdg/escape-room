module.exports = client => {
  if (client.config.logChannel)
    client.logChannel = client.channels.cache.get(client.config.logChannel);

  client.variables = {};
  client.variables.state = "ready";
  client.logSuccess("Bot online!");
};
