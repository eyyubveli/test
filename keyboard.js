const { InlineKeyboard } = require("grammy");
const keyboard = new InlineKeyboard().text('MP3', 'mp3').row().text('MP4', 'mp4');

export default keyboard;