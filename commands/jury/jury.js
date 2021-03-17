const { Canvas, resolveImage } = require('canvas-constructor');
const { Command } = require('discord.js-commando');
const { registerFont } = require('canvas');
registerFont('./fonts/Metropolis-Regular.otf', { family: 'Metropolis', weight: 'normal', style: 'normal' });
registerFont('./fonts/Metropolis-Bold.otf', { family: 'Metropolis', weight: 'bold', style: 'normal' });
registerFont('./fonts/Metropolis-Light.otf', {family: 'Metropolis', weight: 'lighter', style: 'normal' });
const fetch = require('node-fetch');
const countries = require('../../countries.json');

module.exports = class JuryCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'jury',
			aliases: [],
			group: 'jury',
			memberName: 'jury',
			description: 'Generates an image showing jury results.',
			args: [
				{
					key: 'code',
					prompt: 'Country code',
					type: 'string'
				},
				{
					key: 'votes',
					prompt: 'Amount of votes',
					type: 'string',
					default: ''
				},
				{
					key: 'avg',
					prompt: 'Average',
					type: 'string',
					default: ''
				},
				{
					key: 'stdev',
					prompt: 'Standard deviation',
					type: 'string',
					default: ''
				},
			]
		});
	}

	async getColors(code) {
		let colors = countries.find(x => x.code === code).flagColors;

		if (colors.length < 3)
			colors.push(colors[0]);

		return colors;
	}

	async getCountryName(code) {
		return countries.find(x => x.code === code).name;
	}

    async run(message, { code, votes, avg, stdev }) {
		const msg = await message.say('*Generating image, please wait...*');

		let picture;

		const background = await resolveImage('./img/jury/background.png');

		try {
			picture = await resolveImage(`./img/jury/jury_${code}.png`);
		}
		catch {
			picture = await resolveImage('./img/jury/jury_se.png');
		}

		const colors = await this.getColors(code);
		const countryName = await this.getCountryName(code);

		let songTitle, artist;

		await fetch(`${process.env.ENDPOINT}/entry/2021/${code}`)
			.then(res => res.json())
			.then(result => {
				if (result) {
					songTitle = result.songTitle;
					artist = result.artist;
				}
			})
			.catch(err => {
				return message.say(err);
			});

		if (!songTitle || !artist) {
			return message.say("Couldn't fetch artist or song title! Are you sure the country is participating this year?");
		}

		let canvas = new Canvas(1159, 720).printImage(background, 0, 0)
			.printRoundedImage(picture, 660, 327, 472, 207, 53)
			.setColor(colors[0])
			.printRoundedRectangle(660, 100, 24, 43, 50)
			.setColor(colors[1])
			.printRoundedRectangle(692, 100, 24, 43, 50)
			.setColor(colors[2])
			.printRoundedRectangle(724, 100, 24, 43, 50)
			.setColor('#FFFFFF')
			.setTextAlign('right')
			.setTextFont('bold 36pt Metropolis')
			.printText(countryName, 1133, 140, 380)
			.printText(artist, 1133, 245)
			.setTextFont('lighter 36pt Metropolis')
			.printText(songTitle, 1133, 307)
			.setTextFont('bold 36pt Metropolis')
			.setTextAlign('center')
			.printText(votes, 710, 695)
			.printText(avg, 880, 695)
			.printText(stdev, 1055, 695)
			.toBuffer();

        await message.say({
			files: [
				{
					attachment: canvas,
					name: `jury-${code}-${Date.now()}.png`
				}
			]
		});

		msg.delete();
    }
};