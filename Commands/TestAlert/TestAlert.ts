import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test_alert')
		.setDescription('Test an alert to the alert channel')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        if(Server.settings[interaction.guildId] == null || Server.settings[interaction.guildId].alertChannel == null) {
		    await interaction.reply(`No alert channel set at the moment, use /set_alert_channel command to set one.`);
            return;
        }

        let alertChannel: any = null;
        try {
            alertChannel = await interaction.guild.channels.fetch(Server.settings[interaction.guildId].alertChannel) as TextChannel;
        }
        catch(e) {
            interaction.reply("The alert channel defined is invalid.")
            Server.settings[interaction.guildId].alertChannel = null;
            Server.saveSettings();
            return;
        }

        if(alertChannel == null) {
            interaction.reply("The alert channel defined is invalid.")
            Server.settings[interaction.guildId].alertChannel = null;
            Server.saveSettings();
            return;
        }

        (alertChannel as TextChannel).send({
            content: `<@${interaction.user.id}> This is a test alert. If you see this message, the bot works fine.`,
        }).then(() => {
            interaction.reply("The alert has been sent.")
        }).catch((e) => {
            interaction.reply(`An error occured with the alert channel (${e.rawError.message}).`);
        });
	},
};