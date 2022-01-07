const config = require("../../config");

module.exports = TextChannel => {
  return class Channel extends TextChannel {
    constructor(guild, data) {
      super(guild, data);
      this.checkChannel();
    }

    checkChannel() {
      if (!config.channels) return;

      this.is = {};

      for (let channel in config.channels) {
        if (config.channels.hasOwnProperty(channel)) {
          if (typeof config.channels[channel] === "string") {
            this.is[channel] = config.channels[channel] === this.id;
          } else if (Array.isArray(config.channels[channel])) {
            this.is[channel] = config.channels[channel].includes(this.id);
          }
        }
      }
    }
  };
};
