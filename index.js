const { Bot, webhookCallback, InputFile } = require("grammy");
const express = require("express");
const { URL } = require("url");
const axios = require("axios");
const keyboard = require("./src/keyboard");
require("dotenv").config();

let text;

const bot = new Bot(process.env.BOT_TOKEN);



bot.command('start',  async (ctx) => {
    const name = ctx.from.first_name;
  
    return ctx.reply(`Xoş gəldin ${name}. Url daxil et!`);
    

});

async function isTikTokURL(url){
    const pattern = /^(?:https?:\/\/)?(?:www\.)?(?:vt\.)?tiktok\.com\/.*$|^(?:https?:\/\/)?(?:www\.)?vt\.tiktok\.com\/.*$/

    return pattern.test(url);
}

bot.on("message", async (ctx) => {
    text = ctx.message?.text  || "bilinməyən bir yazı formatı" ;

    const checkUrl = await isTikTokURL(text);

    if(!checkUrl) return ctx.reply(`Doğru bir url daxil et`);

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


bot.callbackQuery(["mp3", "mp4"], async (ctx)=>{
    const fileType = ctx.callbackQuery.data;
    const loadingMessage = await ctx.reply('Yüklənir...');
    await ctx.answerCallbackQuery(`${fileType} seçildi!`);
    try{
        await ctx.deleteMessage();
        const response = await axios.request(getOptions());
        const fileMP3 = await response.data.result.music.url_list[0];
        const fileMP4 = await response.data.result.video.url_list[0]; 

        if(fileType === "mp3"){
            await ctx.replyWithAudio(new InputFile(new URL(fileMP3)));
        }else if(fileType === "mp4"){
            await ctx.replyWithVideo(new InputFile(new URL(fileMP4)));
        }
        await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    }catch(err){
        console.log(err);
        return ctx.reply("İndi tapa bilmədim. Daha sonra yenidən yoxla");
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


