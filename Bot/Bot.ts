import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import Config from "../Config/Config";
import path from "path";
import fs from 'fs';
import Server from "../main";

export default class Bot {
    client: null | Client;

    constructor() {
        this.client;
    }

    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            const instance = this;

            this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
            this.client.commands = new Collection();

            const foldersPath = path.join(__dirname, '../Commands');
            const commandFolders = fs.readdirSync(foldersPath);

            for (const folder of commandFolders) {
                const commandsPath = path.join(foldersPath, folder);
                const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
                
                for (const file of commandFiles) {
                    const filePath = path.join(commandsPath, file);
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        this.client.commands.set(command.data.name, command);
                    } else {
                        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                    }
                }
            }

            this.client.on(Events.ClientReady, () => {
                if(!instance.client || !instance.client.user)
                    return;
            
                resolve(`Logged in as ${instance.client.user.tag}!`);
            });

            this.client.on(Events.GuildCreate, guild => {
                Server.deployCommands(guild.id);
            })

            this.client.on(Events.InteractionCreate, async interaction => {
                if (!interaction.isChatInputCommand()) return;
            
                const command = interaction.client.commands.get(interaction.commandName);
            
                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }
            
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            });

            this.client.login(Config.DISCORD_TOKEN);
        })
    }
}