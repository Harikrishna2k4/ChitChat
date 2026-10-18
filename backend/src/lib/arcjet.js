import { ENV } from "./env.js";
import arcjet, { shield, detectBot, slidingWindow} from "@arcjet/node";


const aj = arcjet({
 
  key: ENV.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks such as SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "DRY_RUN", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews such as Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
        mode:"LIVE",
        max: 15,
        interval: 60,
    })
  ],
});

export default aj;