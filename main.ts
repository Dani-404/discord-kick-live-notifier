import { EmbedBuilder, REST, Routes, TextChannel } from "discord.js";
import Bot from "./Bot/Bot";
import fs from 'fs';
import path from 'path';
import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Config from "./Config/Config";

puppeteer.use(StealthPlugin())

class App {
    bot: Bot;
    settings: any;
    browser: any

    constructor() {
        this.bot = new Bot();
        this.settings = null;
        this.browser = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            targetFilter: (target) => !!target.url(),
            headless: false
        });

        let page = (await this.browser.pages())[0];
        await page.setViewport({
            width: 1920,
            height: 1080,
        });
        
        await page.goto('https://kick.com');
        console.log("Waiting for resolve cloudflare captcha...");
        await page.waitForSelector('#search-input-field');
        console.log("Captcha successfully solved.");

        const settings = await fs.readFileSync(path.join(__dirname, './Settings/Settings.txt'));
        this.settings = JSON.parse(settings.toString());
        let initMsg = await this.bot.init();
        this.intervalNotifier();
        console.log(initMsg)
    }

    saveSettings() {
        const cloneSettings = {...this.settings};

        for(let i in cloneSettings) {
            cloneSettings[i].users.forEach((user) => {
                user.isLive = null;
            })
        }

        fs.writeFile(path.join(__dirname, './Settings/Settings.txt'), JSON.stringify(cloneSettings), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    intervalNotifier() {
        this.getStreamInfo();
        setInterval(this.getStreamInfo.bind(this), 1000 * 60 * Config.UPDATE_INTERVAL)
    }

    async getStreamInfo() {
        if (this.bot.client == null)
            return;

        for (let i in this.settings) {
            const guild = this.settings[i];

            const discordGuild = await this.bot.client.guilds.fetch(i);
            if (discordGuild == null) {
                delete this.settings[i];
                this.saveSettings();
                continue;
            }

            if (guild.alertChannel == null)
                continue;

            for (let v in guild.users) {
                await this.sleep(2000)
                
                const user = guild.users[v];

                let page = (await this.browser.pages())[0];
                await page.goto(`https://kick.com/api/v2/channels/${user.username}`);

                const body = await page.waitForSelector('body');
                if (body == null)
                    continue;

                const value = await body.evaluate(el => el.textContent);
                if (value == null)
                    continue;

                let infos;
                try {
                    infos = JSON.parse(value);
                }
                catch {
                    console.log(`[ERROR] An error occured with API URL: https://kick.com/api/v2/channels/${user.username}`)
                    continue;
                }

                if(infos == null)
                    continue;

                let thumbnail = infos.offline_banner_image ? infos.offline_banner_image.src.replace(".jpg", ".webp") : infos.user.profile_pic;

                if(infos.livestream != null) {
                    thumbnail = infos.livestream.thumbnail.url;

                    await this.sleep(2000)
                    await page.goto(`https://kick.com/api/v2/channels/${user.username}/livestream`);

                    const body = await page.waitForSelector('body');
                    if (body != null) {
                        const value = await body.evaluate(el => el.textContent);
                        if (value != null) {

                            let streamInfos;
                            try {
                                streamInfos = JSON.parse(value);
                                streamInfos.data.thumbnail ? thumbnail = streamInfos.data.thumbnail.srcset.split(" ")[0] + `?time=${(new Date()).getTime()}` : null
                            }
                            catch {
                                console.log(`[WARNING] An error occured with API URL: https://kick.com/api/v2/channels/${user.username}/livestream}`)
                            }
                        }
                    }
                }
                
                if (infos.livestream == null && user.isLive != null) {                    
                    let sum = 0;
                    user.isLive.viewersCount.forEach((count) => sum += count);
                    const averageViewers = Math.round(sum/user.isLive.viewersCount.length);

                    const gainFollow = infos.followers_count - user.isLive.followersStart;
                    
                    const embed = new EmbedBuilder().setColor(0x0099FF)
                        .setURL(`https://kick.com/${user.username.toLowerCase()}`)
                        .setAuthor({ name: `STREAM OFF - ${user.username}`, iconURL: infos.user.profile_pic, url: `https://kick.com/${user.username.toLowerCase()}` })
                        .setDescription(`👀 ${averageViewers} average viewers\n🕒 Duration: ${this.convertMinsToHrsMins(user.isLive.duration)}\n👤 Followers: ${gainFollow >= 0 ? "+" : "-" }${gainFollow}`)
                        .setThumbnail(infos.user.profile_pic)
                        .setImage(thumbnail)

                    user.isLive.message.edit({
                        content: ``,
                        embeds: [embed]
                    })
                    .catch((e) => {
                        console.log(`Impossible to edit message.`);
                    });

                    user.isLive = null;
                } else if(infos.livestream != null && user.isLive != null) {
                    user.isLive.viewersCount.push(infos.livestream.viewer_count);

                    let sum = 0;
                    user.isLive.viewersCount.forEach((count) => sum += count);
                    const averageViewers = Math.round(sum/user.isLive.viewersCount.length);

                    const nowUtc = new Date().toLocaleString("en-US", {timeZone: "Europe/London"}),
                        now = new Date(nowUtc);
                    
                    const started_Time = new Date(infos.livestream.start_time);
                    const totalMinutes = (now.getTime() - started_Time.getTime())/60000;
                    user.isLive.duration = totalMinutes;

                    const embed = new EmbedBuilder().setColor(0x0099FF)
                        .setTitle(infos.livestream.session_title)
                        .setURL(`https://kick.com/${user.username.toLowerCase()}`)
                        .setAuthor({ name: user.username, iconURL: infos.user.profile_pic, url: `https://kick.com/${user.username.toLowerCase()}` })
                        .setDescription(`👁️ ${infos.livestream.viewer_count} viewers\n👀 ${averageViewers} average viewers\n🕒 Duration: ${this.convertMinsToHrsMins(totalMinutes)}`)
                        .setThumbnail(infos.user.profile_pic)
                        .setImage(thumbnail)

                    user.isLive.message.edit({
                        content: `@everyone ${guild.message.replace('{0}', user.username)} https://kick.com/${user.username.toLowerCase()}`,
                        embeds: [embed]
                    })
                    .catch((e) => {
                        console.log(`Impossible to edit message.`);
                        user.isLive = null;
                    });
                } else if (infos.livestream != null && user.isLive == null) {
                    let alertChannel: any = null;

                    try {
                        alertChannel = await discordGuild.channels.fetch(guild.alertChannel) as TextChannel;
                    }
                    catch(e) {
                        guild.alertChannel = null;
                        this.saveSettings();
                        continue;
                    }

                    const nowUtc = new Date().toLocaleString("en-US", {timeZone: "Europe/London"}),
                        now = new Date(nowUtc);
                    const started_Time = new Date(infos.livestream.start_time);
                    const totalMinutes = (now.getTime() - started_Time.getTime())/60000;

                    const embed = new EmbedBuilder().setColor(0x0099FF)
                        .setTitle(infos.livestream.session_title)
                        .setURL(`https://kick.com/${user.username.toLowerCase()}`)
                        .setAuthor({ name: user.username, iconURL: infos.user.profile_pic, url: `https://kick.com/${user.username.toLowerCase()}` })
                        .setDescription(`👁️ ${infos.livestream.viewer_count} viewers\n🕒 Duration: ${this.convertMinsToHrsMins(totalMinutes)}`)
                        .setThumbnail(infos.user.profile_pic)
                        .setImage(thumbnail)

                    alertChannel.send({
                        content: `@everyone ${guild.message.replace('{0}', user.username)} https://kick.com/${user.username.toLowerCase()}`,
                        embeds: [embed]
                    }).then((message) => {
                        user.isLive = {message: message, viewersCount: [infos.livestream.viewer_count], duration: totalMinutes, followersStart: infos.followers_count};
                    }).catch((e) => {
                        console.log(`Impossible to send discord message for streamer ${user.username} on guild ${i} (${e.rawError.message}).`)
                    });
                } else
                    user.isLive = null;
            }
        }
    }

    sleep(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    convertMinsToHrsMins(minutes: number): string {
        let h = Math.floor(minutes / 60).toString();
        let m = Math.round((minutes % 60)).toString();
        h = parseInt(h) < 10 ? '0' + h : h; 
        m = parseInt(m) < 10 ? '0' + m : m; 
        return h + ':' + m;
    }

    async deployCommands(guildId: string) {
        const commands = [];
        const foldersPath = path.join(__dirname, 'Commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);

                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON() as never);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        const rest = new REST().setToken(Config.DISCORD_TOKEN);
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands for guild ${guildId}.`);
            await rest.put(
                Routes.applicationGuildCommands(Config.DISCORD_CLIENT_ID, guildId),
                { body: commands },
            );

            console.log(`Successfully reloaded commands for guild ${guildId}.`);
        } catch (error) {
            console.error(error);
        }
    }
}

const Server = new App();
export default Server;
Server.init().catch((e) => `An error occured: ${e.toString()}`)