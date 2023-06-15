const { Bot, webhookCallback, InlineKeyboard, InputFile } = require("grammy");
const express = require("express");
const { URL } = require("url");
const axios = require("axios");
const keyboard = new InlineKeyboard().text('MP3', 'mp3').row().text('MP4', 'mp4');
require("dotenv").config();

const admin = require("firebase-admin");
const serviceAccount = require("./config.json")



admin.initializeApp({
    credential : admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();    

const bot = new Bot(process.env.BOT_TOKEN);

let text = "";

bot.command('start',  (ctx) => {
    const name = ctx.from.first_name;
    return ctx.reply(`Xoş gəldin ${name}. Url daxil et!`);
});


bot.catch((err) => {
    const ctx = err.ctx;
    ctx.reply("Bir xəta oldu. Daha sonra yenidən yoxlayın");
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });


async function isTikTokURL(url){
    const pattern = /^(?:https?:\/\/)?(?:www\.)?(?:vt\.)?tiktok\.com\/.*$|^(?:https?:\/\/)?(?:www\.)?vt\.tiktok\.com\/.*$/

    return pattern.test(url);
}

bot.on("message", async (ctx) => {
    text = ctx.message.text ? ctx.message.text : "bilinməyən bir yazı formatı" ;
    const chatID = ctx.message.chat.id;
    const username = ctx.message.from.username ? ctx.message.from.username : "username tapılmadı" ;
    const name = ctx.from.first_name;
   
    const checkUrl = await isTikTokURL(text);

    const userRef = firestore.collection('users').doc();
    const timeStamp = admin.firestore.FieldValue.serverTimestamp();

    const userData = {
        text : text,
        name : name,
        chatID : chatID,
        username : username,
        timestamp : timeStamp
        
    }

    await userRef.set(userData);
    
    if(!checkUrl) return await ctx.reply(`Doğru bir url daxil et`);
    
    
    await ctx.reply('Format seçin', {
        reply_markup: keyboard,
    });

});

 function getOptions(){
    const options = {
        method: 'GET',
        url: 'https://tiktok-downloader-download-videos-without-watermark1.p.rapidapi.com/media-info/',
        params: {
          link: text,
        },
        headers: {
          'X-RapidAPI-Key': process.env.API_KEY,
          'X-RapidAPI-Host': 'tiktok-downloader-download-videos-without-watermark1.p.rapidapi.com',
        },
      };

    return options;
}

bot.callbackQuery("mp3", async (ctx)=>{
    try {
        const loadingMessage = await ctx.reply('Yüklənir...');
        await ctx.deleteMessage();
        const response = await axios.request(getOptions());
        const mp3 = await response.data.result.music.url_list[0];
        console.log(mp3);
        await ctx.replyWithAudio(new InputFile(new URL(mp3)));
        await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id)
      } catch (err) {
        console.log(err);
          return ctx.reply('Tapa bilmedim yeniden yoxla');
      }
})

bot.callbackQuery("mp4", async (ctx)=>{
    try {
        const loadingMessage = await ctx.reply('Yüklənir...');  
        await ctx.deleteMessage();
        const response = await axios.request(getOptions());
        const mp4 = await response.data.result.video.url_list[0];
        console.log(mp4);
        await ctx.replyWithVideo(new InputFile(new URL(mp4)));
        await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
      } catch (err) {
          console.log(err);
          return ctx.reply('Tapa bilmedim yeniden yoxla');
      }
})

if (process.env.NODE_ENV === "production") {
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  bot.start();
}


