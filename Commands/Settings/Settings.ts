import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Display your settings')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        if(Server.settings[interaction.guildId] == null)
		    await interaction.reply(`No settings set at the moment.`);

        const guild = Server.settings[interaction.guildId];

        let alertChannel = "Not defined";
        if(guild.alertChannel != null)
            alertChannel = `<#${guild.alertChannel}>`

        let users = "";

        if(guild.users.length == 0)
            users = "Empty list";
        else {
            guild.users.forEach((user) => {
                users += `${user.username}: https://kick.com/${user.username.toLowerCase()}\n`
            })

            users.slice(0, -2); 
        }

        const embed = new EmbedBuilder().setColor(0x0099FF)
            .setTitle("Settings")
            .setDescription(`Alert channel: ${alertChannel}\n\nAlert message: ${guild.message.replace('{0}', 'Username')}\n\nKick users:\n ${users}`)

        await interaction.reply({embeds: [embed]})
	},
};