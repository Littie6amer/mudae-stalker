const { config: dotenv } = require("dotenv")
dotenv()

const { Client, GatewayIntentBits, Message, Colors } = require("discord.js")
const { DBManager } = require("./dbManager")
const { EmbedBuilder } = require("@discordjs/builders")
const dbManager = new DBManager()

const path = require("path")

const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
})

client.on("ready", () => {
    console.log("fuck you, i'm on")
})

const worker = new Worker(path.resolve(__dirname, "worker.js"));

worker.on("message", (data) => {
    console.log(data)

    if (data.message == "rolls-reset") {
        let content = "**Rolls have reset!**"
        if (data.claimReset) content += "\n**Claims have reset!**"
        content += " <@&1139223739897237564>"

        const rollResetRun = async () => {
            const guild = client.guilds.cache.get("1123334541063503902")
            const channel = guild.channels.cache.get("1127649722845376712")
            if (!dbManager.claimReset.users.length) {
                if (data.claimReset && dbManager.claimResetMessage != null) {
                    await channel.messages.fetch(dbManager.claimResetMessage).then(m => {
                        m.edit(content)
                        dbManager.claimResetMessage = null
                    }).catch()
                }
                return;
            }
            await channel.send({ content })
            let members = guild.members.cache
            if (members.size < guild.memberCount) members = await guild.members.fetch({ force: true }).catch(() => null)
            if (members != null) guild.members.cache.forEach(m => m.roles.cache.has("1139223739897237564") && m.roles.remove("1139223739897237564"))
            dbManager.resetActive()
        }

        if (client.readyAt) return rollResetRun()
        else client.once("ready", rollResetRun)
    }
})

const prefix = "$"

const texts = {
    "help": {
        "no-args-sub": "### Subscribe to pings for a series roll.\n\n> `$ss [series name]`\n\n### Unsubscribe from pings from series roll.\n\n> `$sr [series]`\n\n### List your subscriptions\n\n> `$subs`"
    }
}

client.on("messageCreate", async (message) => {
    if (message.author.id == "432610292342587392") return mudaeMessageHandler(message)

    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).split(" ")
    const command = args.shift()

    if (!command) return; 

    if (command == "$rs" && message.author.id == "402888568579686401") {
        await dbManager.reset()
        return message.reply({ content: "Subscription data wiped." })
    }

    if (command == "$ls" && message.author.id == "402888568579686401") {
        return message.reply({ content: `\`\`\`${JSON.stringify(dbManager.subs, null, 4)}\`\`\`` })
    }

    if (command != "help" && (command.startsWith("h") || command.startWith("w")) && !dbManager.claimReset.users.includes(message.author.id)) {
        dbManager.addActive(message.author.id)
        message.member.roles.add("1139223739897237564").catch()
        message.react("⏱️")
    }

    if (command == "ss") {
        if (!args.length) return message.reply({ content: texts.help["no-args-sub"] })
        const series = args.join(" ")
        const success = await dbManager.addSubscription(message.author.id, series.toLowerCase())
        if (!success) return message.reply({ content: `Couldn't do that right now!` })
        return message.reply({ content: `You will now be pinged when a character from the **${series}** series is rolled.` })
    }

    if (command == "sr") {
        if (!args.length) return message.reply({ content: texts.help["no-args-sub"] })
        const series = args.join(" ")
        const success = await dbManager.removeSubscription(message.author.id, series.toLowerCase())
        if (!success) return message.reply({ content: `Couldn't do that right now!` })
        return message.reply({ content: `You will no longer be pinged when a character from the **${series}** series is rolled.` })
    }

    if (command == "subs") {
        const series = dbManager.listSubscriptions(message.author.id)
        const listEmbed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({ name: "Your subscriptions" })
            .setDescription(series?.length ? series.join("\n") : "None")
        return message.reply({ embeds: [listEmbed] })
    }

})

/**
 * @name something
 * @function
 * @param {Message} message
 * @returns {*}
 */

function mudaeMessageHandler(message) {
    if (message.embeds.length) {
        const embed = message.embeds[0]
        const lines = embed.description.split("\n");
        const series = lines[0].toLowerCase()
        if (lines[3].includes("<:kakera:469835869059153940>") && !embed.footer?.text?.toLowerCase().includes("belongs to")) {
            const subs = dbManager.listSubscribers(series)
            if (subs != false && subs?.length)
                message.reply({ content: `A character from **${series}** just appeared!\n${subs.map(s => `<@${s}>`)}` })
            setTimeout(() => message.react("⛔"), 45 * 1000)
        }
    }
}

client.login(process.env.BOT_TOKEN)