const Parser = require("rss-parser");
const axios = require("axios");
const fs = require("fs");
const parser = new Parser();
const RSS_URL = ""; // Enter Your RSS Feed URL Here
const DISCORD_WEBHOOK = ""; // Enter Your Discord Webhook Here
const DISCORD_MENTION = ""; // Optional: Discord user or role ID, If its a role put &ROLE_ID, if its a user just put USER_ID.
const CHECK_INTERVAL = 10_000;
const DATA_FILE = "./seen.json";

let seenTopics = [];

if (fs.existsSync(DATA_FILE)) {
    try {
        seenTopics = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        seenTopics = [];
    }
}

async function checkForum() {
    try {
        const feed = await parser.parseURL(RSS_URL);

        if (!feed.items.length) {
            console.log("No topics found.");
            return;
        }

        const newTopics = feed.items
            .filter(item => {
                const topicId = item.guid || item.link;
                return !seenTopics.includes(topicId);
            })
            .reverse();

        if (newTopics.length === 0) {
            return;
        }

        for (const topic of newTopics) {
            const topicId = topic.guid || topic.link;
            console.log("New topic detected:", topic.title);

            await axios.post(DISCORD_WEBHOOK, {
                embeds: [
                    {
                        fields: [
                            // Add Fields Here, 2 Examples are shown below
                            {
                                name: "Default Field",
                                value: "Default Value"
                            },
                        ],
                        timestamp: new Date().toISOString()
                    }
                ],
                content: DISCORD_MENTION ? `<@${DISCORD_MENTION}>` : ""
            });
            seenTopics.push(topicId);

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(seenTopics, null, 2)
            );

            console.log("Discord notification sent:", topic.title);
        }
        if (seenTopics.length > 100) {
            seenTopics = seenTopics.slice(-100);

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(seenTopics, null, 2)
            );
        }

    } catch (error) {
        console.error("Monitor error:", error.message);
    }
}

console.log("Script Started.");

checkForum();
setInterval(checkForum, CHECK_INTERVAL);