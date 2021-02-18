//initialize
const kJS = require("kahoot.js-updated"),
    question = require('readline-sync').question,
    express = require('express'),
    random = require('random-name'),
    app = express(),
    config = require('./config.json');
//keeping track!
let counters = {
    "botsJoined": 0,
    "sentRequests": 0,
    "questionEnd": 0,
    "amountAnswered": 0,
    "amountCorrect": 0,
    "currentQuestion": 0,
    "colors": {
        "Triangle": 0,
        "Diamond": 0,
        "Circle": 0,
        "Square": 0
    },
    "topBot": {
        "name": "Placeholder",
        "totalScore": 0,
        "rank": 0,
        "correctCount": 0,
        "incorrectCount": 0
    }
},
twoFA = [0,1,2,3],
working = [];

process.setMaxListeners(Number.POSITIVE_INFINITY)

if (config.useConfig) {
    console.log('Using config...')
    setTimeout(() => {
        console.clear();
        return flood(config.amount, config.antiBot, config.pin, config.name, config.nameBypass, config.autoReconnect)
    }, 1000)
} else {
    console.clear();
    // webServer = question('Do you want to use a site (must have port 5626 open locally!), or use this app? (site/app) > ');
    console.clear();

    // if (webServer == "site") {
    //     app.use(express.static('public'));
    //     app.post('/flood', (req, res) => {

    //     })
    //     app.listen(5626, () => {
    //         console.log(`Kashoot setup at http://localhost:5626.`)
    //     })
    // } else {
        const botAmount = question('How much bots do you want to send? (1-1000) (Note that some votes WILL NOT register over 250 bots in the first question. The application will still count the unregistered bots.) > ');
        if (isNaN(botAmount) || botAmount == "") {
            console.log('Invalid number! Exiting...');
            return setTimeout(() => process.exit(), 1000);
        } else if (botAmount > 1000) {
            console.log('Too much bots! The limit is 1000. Exiting...');
            return setTimeout(() => process.exit(), 1000);
        } else if (!botAmount) {
            console.log('No bots! You need a minimum of 1 bot. Exiting...');
            return setTimeout(() => process.exit(), 1000);
        }
        const antiBot = question('Do you want to bypass theusaf\'s antibot? (Names will be randomized, and join times will be slower & randomized. All bots may not join!) (y/n) > ');
        const pin = question('What is the game pin? > ');
        if (isNaN(pin) || pin == "") {
            console.log('Invalid PIN is provided! Exiting...');
            return setTimeout(() => process.exit(), 1000);
        }
        if (antiBot == "y") {
            console.clear();
            flood(Number(botAmount), antiBot, pin);
        } else {
            const botName = question('What do you want the bot\'s names to be? > '),
                nameBypass = question('Do you want bot names to be bypassed? (y/n) > '),
                autoReconnect = question('Do you want the bots to reconnect automatically? (y/n) > ');
            console.clear();
            flood(Number(botAmount), false, pin, botName, nameBypass, autoReconnect);
        }
    }
// }

function bypassName(name) {
    bypassedLetters = {
        'a': 'ᗩ',
        'b': 'ᗷ',
        'c': 'ᑕ',
        'd': 'ᗪ',
        'e': 'E',
        'f': 'F',
        'g': 'G',
        'h': 'H',
        'i': 'I',
        'j': 'ᒍ',
        'k': 'K',
        'l': 'ᒪ',
        'm': 'ᗰ',
        'n': 'N',
        'o': 'O',
        'p': 'ᑭ',
        'q': 'ᑫ',
        'r': 'ᖇ',
        's': 'S',
        't': 'T',
        'u': 'ᑌ',
        'v': 'ᐯ',
        'w': 'ᗯ',
        'x': '᙭',
        'y': 'Y',
        'z': 'ᘔ'
    }
    return name.toLowerCase().replace(/[a-z]/g, (letter) => bypassedLetters[letter])
}

function shuffle(arr) {
    arr.sort(() => Math.random() - 0.5);
}

function genRandomName() {
    let randomGenName = "";
    switch (Math.floor(Math.random() * 4 + 1)) {
        case 1: // first & middle
            randomGenName = `${random.first()} ${random.middle()}`
            break;
        case 2: // middle & last
            randomGenName = `${random.last()} ${random.middle()}`
            break;
        case 3: // first & last
            randomGenName = `${random.first()} ${random.last()}`
            break;
        case 4: // middle & first
            randomGenName = `${random.middle()} ${random.first()}`
            break;
    }
    return randomGenName;
}

function flood(amount, anti, pin, name, bypass, reconnect) {
    if (counters.sentRequests == amount) return;
    counters.sentRequests++
    if (anti == "y") {
        name = genRandomName().substring(0, 15);
        setTimeout(() => join(pin, name), Math.floor(Math.random() * 120))
        setTimeout(() => flood(amount, anti, pin, name, bypass, reconnect), Math.floor(Math.random() * 600))
    } else {
        setTimeout(() => {
            if (bypass == "y") name = bypassName(name); // use different charset
            join(pin, name + counters.sentRequests, reconnect, anti)
            flood(amount, anti, pin, name, bypass, reconnect)
        }, 30)
    }
}

function join(pin, name, reconnect, anti) {
    const client = new kJS();
    client.join(pin, name).then(joined => {
        console.log(`Bot ${name} has joined.`)
        if (joined.twoFactorAuth) {
            bypass = setInterval(()=>{
                if(working.length == 4) return client.answerTwoFactorAuth(working);
                working = [];
                shuffle(twoFA);
                client.answerTwoFactorAuth(twoFA)
            },1000)
            client.on("TwoFactorCorrect", ()=>{
                working = twoFA;
                clearInterval(bypass);
            });
            client.answerTwoFactorAuth(twoFA);
        }
        if (counters.botsJoined + 1 == counters.sentRequests) return console.log('All bots have been sent.');
        counters.botsJoined++
    }).catch((err) => {
        if (err.description == "Duplicate name") {
            console.log("Duplicate name. Rejoining with a randomized name.");
            return join(pin, genRandomName().substring(0, 15), reconnect, anti);
        }
        if (err.description == "Invalid/Missing PIN") {
            console.log('Given an invalid PIN. Exiting...');
            return setTimeout(() => process.exit(), 1000)
        }
        if (reconnect) {
            console.log(`Bot ${name} failed to join. Maybe the bot is banned? Rejoining.`)
            return join(pin, name.substring(0, 1) + Math.floor(Math.random() * 1500 / -1))
        }
    });
    client.on("QuestionReady", () => {
        counters.colors = {
                "Triangle": 0,
                "Diamond": 0,
                "Circle": 0,
                "Square": 0
            },
            counters.amountCorrect = 0,
            counters.amountAnswered = 0,
            counters.questionEnd = 0;
    })
    client.on("QuestionStart", (question) => {
        counters.currentQuestion = question.index + 1
        let randomAnswer = Math.floor(Math.random() * question.quizQuestionAnswers[question.index]);
        setTimeout(() => {
            question.answer(randomAnswer).then(() => {
                if (!randomAnswer) counters.colors.Triangle++;
                else if (randomAnswer == 1) counters.colors.Diamond++;
                else if (randomAnswer == 2) counters.colors.Circle++;
                else if (randomAnswer == 3) counters.colors.Square++;
                console.clear();
                counters.amountAnswered++
                console.log(`
BOT STATS:
-----------------------------------------------
${counters.colors.Triangle} voted for Triangle. 
${counters.colors.Diamond} voted for Diamond. 
${counters.colors.Circle} voted for Circle. 
${counters.colors.Square} voted for Square.

${counters.amountAnswered} bots have voted.

─── bots got the answer right. The answer was ─────────.
-----------------------------------------------`);
            })
        }, (counters.botsJoined > 99) ? Math.floor(Math.random() * question.timeAvailable-1000):Math.floor(Math.random() * 2500))
    })
    client.on("QuestionEnd", (question) => {
        if (!question.choice) return;
        console.clear();
        console.log(`
BOT STATS:
-----------------------------------------------
${counters.colors.Triangle} voted for Triangle. 
${counters.colors.Diamond} voted for Diamond. 
${counters.colors.Circle} voted for Circle. 
${counters.colors.Square} voted for Square.

${counters.amountAnswered} bots have voted.

${counters.colors[(question.correctChoices).toString().replace('0', "Triangle").replace('1', "Diamond").replace('2', "Circle").replace('3', "Square")]} bots got the answer right. The answer was ${(question.correctChoices).toString().replace('0', "Triangle").replace('1', "Diamond").replace('2', "Circle").replace('3', "Square")}.
-----------------------------------------------`);
    })

    client.on("QuizEnd", (stats) => {
        statsCheck(stats);
        console.clear();
        console.log(`
Top bot: ${counters.topBot.name}
---------------------------------------------
Place: ${counters.topBot.rank}
Score: ${counters.topBot.totalScore}
---------------------------------------------
Questions right: ${counters.topBot.correctCount}
---------------------------------------------
Questions wrong: ${counters.topBot.incorrectCount}
---------------------------------------------
Thanks for using Kashoot!
`)

        function statsCheck(stats) {
            if (counters.topBot.totalScore < stats.totalScore) {
                for(var variable in stats) {
                    counters.topBot[variable] = stats[variable];
                }
            }
        };

        setTimeout(() => process.exit(), 5000)

    })

    process.on('SIGINT', function() {
        client.leave();
        --counters.botsJoined;
        if (counters.botsJoined <= 0) {
            console.log('Goodbye bots!')
            process.exit();
        }
    });
}