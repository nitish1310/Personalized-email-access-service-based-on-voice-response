const fs = require("fs");
var express = require("express");
var app = express();
const readline = require("readline");
const cors = require("cors");
const { google } = require("googleapis");
const dotenv = require("dotenv").config();
const _ = require("lodash");
const textToSpeech = require("@google-cloud/text-to-speech");
var player = require("play-sound")({
  player: "C:/Users/Nitish-PC/Downloads/mplayer-svn-38117/mplayer.exe",
});
var WaveformPlaylist = require("waveform-playlist");
var bodyParser = require("body-parser");

app.use(cors());
//var cors = require("cors");
//app.use(cors());
var lexrank = require("lexrank");
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

//Access public files like css
app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({ extended: false }));
// set ejs as rendering engine
app.set("view engine", "ejs");

app.get("/test", function (req, res) {
  res.send("EMAILS ARE:");
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getRecentEmail);
  });
});

app.get("/summary", function (req, res) {
  summaryText(function (text) {
    //console.log(labelData);
    res.render("index.ejs", {
      text: text,
    });
  });
});

app.get("/url", (req, res, next) => {
  //res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
  // fs.readFile("credentials.json", (err, content) => {
  //   if (err) return console.log("Error loading client secret file:", err);
  //   // Authorize a client with credentials, then call the Gmail API.
  //   const result = authorize(JSON.parse(content), listLabels);
  //   res.send(result);
  // });
  //res.send("Hello");
  //console.log(listLabels());
  //res.send(listLabels());
  listLabels(function (labelData) {
    //console.log(labelData);
    res.json(labelData);
  });
  console.log("Data recieved");
  //res.end();
});

app.get("/messageList", function (req, res) {
  AllMessageList(function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  console.log("Data recieved");
});

app.get("/getDataById/:id", function (req, res) {
  let msgId = req.params.id;
  console.log(msgId);
  GetDataById(msgId, function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  console.log("Data recieved");
});

app.get("/getDataByThreadId/:id", function (req, res) {
  let threadId = req.params.id;
  console.log(threadId);
  GetThreadDataById(threadId, function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  console.log("Data recieved");
});

app.get("/searchEmail", function (req, res) {
  var threadName = req.query.name; //mytext is the name of your input box
  GetEmailThreadDataByName(threadName, function (messageData) {
    res.json(messageData);
  });
  res.render("test.ejs");
});
app.get("/messageIdList", function (req, res) {
  MessageIdList(function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  console.log("Data recieved");
});

app.get("/messageCount", function (req, res) {
  //var threadName = req.query.name;
  var threadName = "Here are the emails count from Nitish";
  GetEmailThreadDataCount(threadName, function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  res.render("test.ejs");
  //console.log("Data recieved");
});

app.get("/check", function (req, res) {
  //res.send("EMAILS ARE:");
  // parse html forms

  res.render("index.ejs");
});

app.get("/playlist", function (req, res) {
  //res.send("EMAILS ARE:");
  // parse html forms
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getThreadEmailData);
  });

  res.render("voice.ejs");
});

app.get("/attachment", function (req, res) {
  attachmentData(function (messageData) {
    //console.log(labelData);
    res.json(messageData);
  });
  console.log("Data recieved");
});

app.get("/emails", function (req, res) {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    // res.send(getMessage);
    res.send("Hello");
    authorize(JSON.parse(content), getMessage);
    // res.send("Emails: " + authorize(JSON.parse(content), getMessage));
  });
});

app.get("/go", function (req, res, resp) {
  let result;
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getThreadsPlaylist);
  });
});

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Gmail API.
  //authorize(JSON.parse(content), getThreads);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
      console.log(callback(oAuth2Client));
    });
  });
}

function summaryText(cb) {
  var originalText =
    "After a surprise release U-turn last month, Google has now rolled out Chrome 81 and it brings a wide roll-out of ‘Tab Groups’, the company’s biggest change to how Chrome tabs work since the browser launched 11 years ago.  As the name suggests, Tab Groups is a new way to organize the mass of tabs you have open at any one time in Chrome and, not only is it ingenious, it couldn’t be simpler to use. From here, there are plenty of customisation options. Click on the group header (a colored dot is used by default) to customize the group name (tip: keep them short to avoid wasting valuable tab space), change the group color, ungroup tabs or close all tabs in the group. Once you create your first group, you can also right click on any tab to ungroup it or move it to any of your existing groups. Like all the best ideas, Tab Groups is wonderfully simple and it will change the way you use Chrome. Notably, you will no longer need to keep separate browser windows open for different projects, they can all coexist in a single window because each project is clearly defined. This alone will save you 100s of wasted clicks a day. Needless to say, tab management in Chrome is long overdue and numerous third-party extensions have sprung up to fill the gap over the years. That said, while no one solution will suit all users, Google’s approach is the best I’ve seen. Furthermore, while I’m also a user of other Chromium-based browsers like Brave, for now, this feature is only found in Google Chrome.  Chrome 81 is rolling out for Windows, Mac and Linux right now. If for any reason you don’t see Tab Groups after updating (Help > About), you can manually enable them by using this flag in the Chrome address bar: chrome://flags/#tab-groups. So, if you haven’t tried Tab Groups yet, I urge you to do it right now.";
  var topLines = lexrank.summarize(originalText, 5, function (
    err,
    toplines,
    text
  ) {
    if (err) {
      console.log(err);
    }
    console.log(toplines);

    console.log("SUmmary: " + text);
    cb(text);
  });
}

function jsonData() {
  var book = {
    title: "JavaScript",
    authors: ["J"],
    edition: 3,
    year: 2011,
  };
  return book;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(cb) {
  // const gmail = google.gmail({ version: "v1", auth });
  // return new Promise(resolve => {
  //   gmail.users.labels.list(
  //     {
  //       userId: "me"
  //     },
  //     (err, res) => {
  //       if (err) return console.log("The API returned an error: " + err);
  //       let labels = res.data.labels;
  //       if (res.data.labels.length) {
  //         console.log("Labels:");
  //         // console.log(res);
  //         resolve(labels);
  //         // labels.forEach(label => {
  //         //   console.log(`- ${label.name}`);
  //         //   label.name;
  //         // });
  //         // for (var i = 0; i < res.data.labels.length; i++) {
  //         //   var label = res.data.labels[i].name;
  //         //   //console.log("%s", label);
  //         //   // return label;
  //         // }
  //       } else {
  //         console.log("No labels found.");
  //       }
  //       //console.log(labels);
  //       // return labels;
  //     }
  //   );
  // });
  const gmail = google.gmail({ version: "v1" });
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.labels.list(
            {
              auth: auth,
              userId: "me",
            },
            function (err, response) {
              let result = response.data.labels;
              cb(result);
              //console.log(result);
            }
          );
        });
      } catch (e) {}
    });
  });
  //return "hello";
}

function AllMessageList(cb) {
  const gmail = google.gmail({ version: "v1" });
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.messages.list(
            {
              auth: auth,
              userId: "me",
              maxResults: 5,
            },
            function (err, response) {
              let message_id = [];
              for (i = 0; i < 5; i++) {
                //console.log("Message: ", response.data.messages[i]);
                // message_id = response["data"]["messages"][i]["id"];
                //console.log("message_id are: " + message_id);
                String(message_id.push(response["data"]["messages"][i]["id"]));
              }
              var arrayLength = message_id.length;
              console.log(arrayLength);
              let result = [];
              for (let j = 0; j < 1; j++) {
                console.log("message_id" + j + ": " + message_id[j]);

                // Retreive the actual message using the message id
                gmail.users.messages.get(
                  {
                    auth: auth,
                    userId: "me",
                    id: message_id[j],
                  },
                  function (err, response) {
                    if (err) {
                      console.log("The API returned an error: " + err);
                      return;
                    }
                    //console.log("Email Body " + response.data.snippet);

                    //var len = response.data.payload.headers.length;
                    // console.log(len);
                    // for (var k = 0; k < len; k++) {
                    //   header = response.data.payload.headers[k].name;
                    //   if (header == "From") {
                    // console.log(
                    //   "FROM: " + response.data.payload.headers[k].value
                    // );

                    // console.log("Email Body: " + response.data.snippet);
                    //console.log("Message: ", response.data);

                    String(result.push(response.data));
                    console.log(result);

                    //   }
                    // }

                    cb(result);
                  }
                );
              }
            }
          );
        });
      } catch (e) {}
    });
  });
}

function MessageIdList(cb) {
  const gmail = google.gmail({ version: "v1" });
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.messages.list(
            {
              auth: auth,
              userId: "me",
              labelIds: ("INBOX", "CATEGORY_PERSONAL"),
              maxResults: 5,
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              let result = response.data;
              console.log(result);
              cb(result);
            }
          );
        });
      } catch (e) {}
    });
  });
}

function GetDataById(id, cb) {
  const gmail = google.gmail({ version: "v1" });
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.messages.get(
            {
              auth: auth,
              userId: "me",
              id: id,
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              let result = response.data;
              console.log(result);
              cb(result);
            }
          );
        });
      } catch (e) {}
    });
  });
}

function GetThreadDataById(id, cb) {
  const gmail = google.gmail({ version: "v1" });
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.threads.get(
            {
              auth: auth,
              userId: "me",
              id: id,
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              let result = response.data;
              console.log(result);
              cb(result);
            }
          );
        });
      } catch (e) {}
    });
  });
}

/**
 * Get the recent email from your Gmail account
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getRecentEmail(auth) {
  // Only get the recent email - 'maxResults' parameter
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.list(
    { auth: auth, userId: "me", maxResults: 10 },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }

      // Get the message id which we will need to retreive tha actual message next.
      var message_id = response["data"]["messages"][0]["id"];

      // Retreive the actual message using the message id
      gmail.users.messages.get(
        { auth: auth, userId: "me", id: message_id },
        function (err, response) {
          if (err) {
            console.log("The API returned an error: " + err);
            return;
          }

          //console.log(response["data"]);

          message_raw = response["data"]["payload"]["parts"][0].body.data;
          data = message_raw;
          buff = new Buffer(data, "base64");
          text = buff.toString();
          console.log(text);
        }
      );
    }
  );
}

/**
 * Get all the message IDs in the authenticated user's inbox.
 */
function listMessages(auth) {
  console.log("HEllo");
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.list(
    { auth: auth, userId: "me", maxResults: 10 },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }

      // Get the message id which we will need to retreive tha actual message next.
      var message_id;

      console.log("Message IDs:");
      message_id.forEach((messages) => {
        console.log(response["data"]["messages"][0]["id"]);
      });
    }
  );
}

/**
 * Get Message with given ID.
 */

function getMessage(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  return gmail.users.messages
    .list({
      userId: "me",
      maxResults: 5,
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).

        var i;
        for (i = 0; i < 5; i++) {
          console.log("Message: ", response.data);
          // response.data.messages;
        }
      },

      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getThreads(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  return gmail.users.threads
    .list({
      userId: "me",
      maxResults: 10,
      includeSpamTrash: false,
    })
    .then(
      function (response) {
        console.log("Length:" + response.data.length);
        // Handle the results here (response.result has the parsed body).
        for (var i = 0; i < 1; i++) {
          // console.log("Response:  ", response.data.threads[i].snippet);
          console.log("Email: " + i);
          console.log(response.data.threads[i].snippet);
          resp = response.data.threads[i].snippet;
          var item = response.data.threads[i].snippet;
          const client = new textToSpeech.TextToSpeechClient();
          const request = {
            // The text to synthesize
            input: {
              text: item,
            },

            // The language code and SSML Voice Gender
            voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

            // The audio encoding type
            audioConfig: { audioEncoding: "MP3" },
          };

          const outputFileName = "output" + i + ".mp3";

          client
            .synthesizeSpeech(request)
            .then(async (response) => {
              //console.log(response);
              const audioContent = _.get(response[0], "audioContent");
              // console.log(audioContent);
              if (audioContent) {
                fs.writeFileSync(outputFileName, audioContent, "binary");
                //console.log(
                //`Audio content successfully written to file: ${outputFileName}`
                //);
              } else {
                console.log("Failed to get audio content");
              }
            })
            .catch((err) => {
              console.log("ERROR:", err);
            });

          player.play("output" + i + ".mp3", function (err) {
            if (err) throw err;
          });

          console.log("Playing Audio:" + i);

          //console.log("Response", response.data.threads[2].snippet);
          //console.log("Response", response["data"]["threads"]["snippet"]);
        }
      },
      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getThreadsPlaylist(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  return gmail.users.threads
    .list({
      userId: "me",
      maxResults: 10,
      includeSpamTrash: false,
    })
    .then(
      function (response) {
        // console.log("Length:" + response.data.length);
        // Handle the results here (response.result has the parsed body).

        for (var i = 0; i < 2; i++) {
          // console.log("Response:  ", response.data.threads[i].snippet);
          // console.log("Email: " + i);
          console.log("Threads: " + response.data.threads[i].snippet);
          var item = response.data.threads[i].snippet;
          const client = new textToSpeech.TextToSpeechClient();
          const request = {
            // The text to synthesize
            input: {
              text: item,
            },

            // The language code and SSML Voice Gender
            voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

            // The audio encoding type
            audioConfig: { audioEncoding: "MP3" },
          };

          const outputFileName = "public/music/output" + i + ".mp3";

          client
            .synthesizeSpeech(request)
            .then(async (response) => {
              //console.log(response);
              const audioContent = _.get(response[0], "audioContent");
              // console.log(audioContent);
              if (audioContent) {
                fs.writeFileSync(outputFileName, audioContent, "binary");

                //console.log(
                //`Audio content successfully written to file: ${outputFileName}`
                //);
              } else {
                console.log("Failed to get audio content");
              }
            })
            .catch((err) => {
              console.log("ERROR:", err);
            });

          //player.play("output" + i + ".mp3", function(err) {
          //  if (err) throw err;
          // });

          //console.log("Response", response.data.threads[2].snippet);
          //console.log("Response", response["data"]["threads"]["snippet"]);
        }
      },
      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getAllData(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  var i;
  let header;
  return gmail.users.messages
    .list({
      userId: "me",
      labelIds: "INBOX",
      maxResults: 5,
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).
        // console.log("From :" + response["data"]);
        var message_id = [];
        for (i = 0; i < 5; i++) {
          //console.log("Message: ", response.data.messages[i]);
          // message_id = response["data"]["messages"][i]["id"];
          //console.log("message_id are: " + message_id);
          String(message_id.push(response["data"]["messages"][i]["id"]));
        }
        var arrayLength = message_id.length;
        console.log(arrayLength);
        for (let j = 0; j < arrayLength; j++) {
          console.log("message_id" + j + ": " + message_id[j]);

          // Retreive the actual message using the message id
          gmail.users.messages.get(
            {
              auth: auth,
              userId: "me",
              id: message_id[j],
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              //console.log("Email Body " + response.data.snippet);

              var len = response.data.payload.headers.length;
              // console.log(len);
              for (var k = 0; k < len; k++) {
                header = response.data.payload.headers[k].name;
                if (header == "From") {
                  console.log(
                    "FROM: " + response.data.payload.headers[k].value
                  );

                  console.log("Email Body: " + response.data.snippet);

                  //Email Body Conversion
                  const client = new textToSpeech.TextToSpeechClient();
                  //let item = response.data.snippet;
                  const request = {
                    // The text to synthesize

                    input: {
                      text: response.data.snippet,
                    },

                    // The language code and SSML Voice Gender
                    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

                    // The audio encoding type
                    audioConfig: { audioEncoding: "MP3" },
                  };

                  const outputFileName = "public/music/output" + j + ".mp3";

                  client
                    .synthesizeSpeech(request)
                    .then(async (response) => {
                      //console.log(response);
                      const audioContent = _.get(response[0], "audioContent");
                      // console.log(audioContent);
                      if (audioContent) {
                        fs.writeFileSync(
                          outputFileName,
                          audioContent,
                          "binary"
                        );

                        // console.log(
                        //   `Audio content successfully written to file: ${outputFileName1}`
                        // );
                      } else {
                        console.log("Failed to get audio content");
                      }
                    })
                    .catch((err) => {
                      console.log("ERROR:", err);
                    });

                  const client2 = new textToSpeech.TextToSpeechClient();
                  //let item = response.data.snippet;
                  const request2 = {
                    // The text to synthesize
                    input: {
                      text: response.data.payload.headers[k].value,
                    },

                    // The language code and SSML Voice Gender
                    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

                    // The audio encoding type
                    audioConfig: { audioEncoding: "MP3" },
                  };

                  const outputFileName2 = "public/music/sender" + j + ".mp3";

                  client2
                    .synthesizeSpeech(request2)
                    .then(async (response2) => {
                      //console.log(response);
                      const audioContent2 = _.get(response2[0], "audioContent");
                      // console.log(audioContent);
                      if (audioContent2) {
                        fs.writeFileSync(
                          outputFileName2,
                          audioContent2,
                          "binary"
                        );

                        // console.log(
                        //   `Audio content successfully written to file: ${outputFileName2}`
                        // );
                      } else {
                        console.log("Failed to get audio content");
                      }
                    })
                    .catch((err) => {
                      console.log("ERROR:", err);
                    });
                }
              }
            }
          );
        }
      },

      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getEmailData(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  var i;
  let header;
  let subject;
  return gmail.users.messages
    .list({
      userId: "me",
      labelIds: "INBOX",
      maxResults: 2,
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).
        // console.log("From :" + response["data"]);
        var message_id = [];
        for (i = 0; i < 2; i++) {
          //console.log("Message: ", response.data.messages[i]);
          // message_id = response["data"]["messages"][i]["id"];
          //console.log("message_id are: " + message_id);
          String(message_id.push(response["data"]["messages"][i]["id"]));
        }
        var arrayLength = message_id.length;
        console.log(arrayLength);
        for (let j = 0; j < arrayLength; j++) {
          console.log("message_id" + j + ": " + message_id[j]);

          // Retreive the actual message using the message id
          gmail.users.messages.get(
            {
              auth: auth,
              userId: "me",
              id: message_id[j],
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              //console.log("Email Body " + response.data.snippet);

              var len = response.data.payload.headers.length;
              // console.log(len);
              for (var k = 0; k < len; k++) {
                header = response.data.payload.headers[k].name;

                if (header == "From") {
                  console.log(
                    "FROM: " + response.data.payload.headers[k].value
                  );
                  message_raw = response.data.payload.parts[0].body.data;
                  // console.log(message_raw);
                  data = message_raw;
                  buff = new Buffer(data, "base64");
                  text = buff.toString();
                  //console.log(text);
                  console.log("Email Body: " + text);
                  //console.log("Email Body: " + response.data.snippet);

                  //Email Body Conversion
                  const client = new textToSpeech.TextToSpeechClient();
                  //let item = response.data.snippet;
                  const request = {
                    // The text to synthesize

                    input: {
                      text: text,
                    },

                    // The language code and SSML Voice Gender
                    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

                    // The audio encoding type
                    audioConfig: {
                      audioEncoding: "MP3",
                      pitch: 0,
                      speakingRate: 0.75,
                    },
                  };

                  const outputFileName = "public/music/output" + j + ".mp3";

                  client
                    .synthesizeSpeech(request)
                    .then(async (response) => {
                      //console.log(response);
                      const audioContent = _.get(response[0], "audioContent");
                      // console.log(audioContent);
                      if (audioContent) {
                        fs.writeFileSync(
                          outputFileName,
                          audioContent,
                          "binary"
                        );

                        // console.log(
                        //   `Audio content successfully written to file: ${outputFileName1}`
                        // );
                      } else {
                        console.log("Failed to get audio content");
                      }
                    })
                    .catch((err) => {
                      console.log("ERROR:", err);
                    });

                  const client2 = new textToSpeech.TextToSpeechClient();
                  //let item = response.data.snippet;
                  let emailFrom = "Email From ";
                  let senderName = response.data.payload.headers[k].value;
                  let resSender = emailFrom.concat(senderName);
                  const request2 = {
                    // The text to synthesize
                    input: {
                      text: resSender,
                    },

                    // The language code and SSML Voice Gender
                    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },

                    // The audio encoding type
                    audioConfig: {
                      audioEncoding: "MP3",
                      pitch: 0,
                      speakingRate: 0.75,
                    },
                  };

                  const outputFileName2 = "public/music/sender" + j + ".mp3";

                  client2
                    .synthesizeSpeech(request2)
                    .then(async (response2) => {
                      //console.log(response);
                      const audioContent2 = _.get(response2[0], "audioContent");
                      // console.log(audioContent);
                      if (audioContent2) {
                        fs.writeFileSync(
                          outputFileName2,
                          audioContent2,
                          "binary"
                        );

                        // console.log(
                        //   `Audio content successfully written to file: ${outputFileName2}`
                        // );
                      } else {
                        console.log("Failed to get audio content");
                      }
                    })
                    .catch((err) => {
                      console.log("ERROR:", err);
                    });
                }
              }
            }
          );
        }
      },

      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getDataOfEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  var i;
  let header;
  let subject;
  return gmail.users.messages
    .list({
      userId: "me",
      labelIds: ("INBOX", "CATEGORY_PERSONAL"),
      maxResults: 2,
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).
        // console.log("From :" + response["data"]);
        var message_id = [];
        for (i = 0; i < 2; i++) {
          //console.log("Message: ", response.data.messages[i]);
          // message_id = response["data"]["messages"][i]["id"];
          //console.log("message_id are: " + message_id);
          String(message_id.push(response["data"]["messages"][i]["id"]));
        }
        var arrayLength = message_id.length;
        console.log(arrayLength);
        for (let j = 0; j < arrayLength; j++) {
          console.log("message_id" + j + ": " + message_id[j]);

          // Retreive the actual message using the message id
          gmail.users.messages.get(
            {
              auth: auth,
              userId: "me",
              id: message_id[j],
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              //console.log("Email Body " + response.data.snippet);

              var len = response.data.payload.headers.length;
              let from = "";
              let date = "";
              let subject = "";
              let body = "";
              let headerContent = response.data.payload.headers;
              // console.log(len);
              // for (var key in headerContent) {
              //   console.log("snippet" + headerContent[key].value);
              // }

              for (var key in headerContent) {
                // from = headerContent[mParts].payload.headers[0].value;
                // console.log("from" + from);
                // header = response.data.payload.headers[k].name;
                if (headerContent[key].name == "Date") {
                  date = headerContent[key].value.slice(0, -9);
                  //console.log("Date" + date);
                } else if (headerContent[key].name == "From") {
                  from = headerContent[key].value;
                  //console.log("from" + from);
                } else if (headerContent[key].name == "Subject") {
                  if (headerContent[key].value.substring(0, 4) == "Fwd:") {
                    let str = headerContent[key].value;
                    subject = str.replace("Fwd:", "");
                    console.log("Loop executed");
                  } else if (
                    headerContent[key].value.substring(0, 3) == "Re:"
                  ) {
                    let str = headerContent[key].value;
                    subject = str.replace("Re:", "");
                    console.log("Loop executed");
                  } else {
                    subject = headerContent[key].value;
                    console.log("Loop not executed");
                  }
                  // console.log("subject" + subject);
                }
              }
              // console.log(
              //   "Header: " + response.data.payload.parts[1].headers[1].value
              // );
              if (
                subject.substring(0, 4) == "Fwd:" ||
                subject.substring(0, 3) == "Re:" ||
                response.data.payload.body.data != null
              ) {
                message_raw = response.data.payload.body.data;
                //console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                text = buff.toString();
                console.log("First loop");
              } else if (
                // response.data.payload.parts[1].headers[1].value.match(
                //   /attachment; filename=.*/
                // ) &&
                response.data.payload.parts[0].mimeType == "text/plain"
              ) {
                message_raw = response.data.payload.parts[0].body.data;
                // console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                text = buff.toString();
                console.log("Second loop");
              } else {
                message_raw = response.data.payload.parts[0].parts[0].body.data;
                // console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                let attachment =
                  response.data.payload.parts[1].body.size / Math.pow(1024, 1);
                let shortAttach = Math.round(attachment * 100) / 100;
                text =
                  buff.toString() +
                  ". " +
                  " The attachment along with this email is " +
                  response.data.payload.parts[1].filename +
                  "." +
                  " The Attachment type is " +
                  response.data.payload.parts[1].mimeType +
                  "." +
                  " The Attachment size is " +
                  shortAttach +
                  " MB. ";
                console.log("third loop");
              }
              //console.log(text);
              //console.log("Email Body: " + text);

              let emailText = text.replace(/>/g, "");
              body =
                "Email from  " +
                from +
                "." +
                " Email Subject is " +
                subject +
                "." +
                " Email date is " +
                date +
                "." +
                " Email body is " +
                emailText +
                "." +
                " Next  ";
              console.log("Email Body: " + body);

              let allData = body.substring(0, 4999);

              const client2 = new textToSpeech.TextToSpeechClient();

              const request2 = {
                // The text to synthesize
                input: {
                  text: allData,
                },

                // The language code and SSML Voice Gender
                voice: { languageCode: "en-US", name: "en-US-Wavenet-A" },

                // The audio encoding type
                audioConfig: {
                  audioEncoding: "MP3",
                  pitch: 0,
                  speakingRate: 0.6,
                },
              };

              const outputFileName2 = "public/music/email" + j + ".mp3";

              client2
                .synthesizeSpeech(request2)
                .then(async (response2) => {
                  //console.log(response);
                  const audioContent2 = _.get(response2[0], "audioContent");
                  // console.log(audioContent);
                  if (audioContent2) {
                    fs.writeFileSync(outputFileName2, audioContent2, "binary");

                    // console.log(
                    //   `Audio content successfully written to file: ${outputFileName2}`
                    // );
                  } else {
                    console.log("Failed to get audio content");
                  }
                })
                .catch((err) => {
                  console.log("ERROR:", err);
                });
            }
          );
        }
      },

      function (err) {
        console.error("Execute error", err);
      }
    );
}

function getThreadEmailData(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  var i;
  let header;
  let subject;
  let pitchRate = 0;
  let speakingRate = 0.75;
  let VisionText = "";
  return gmail.users.messages
    .list({
      userId: "me",
      labelIds: ("INBOX", "CATEGORY_PERSONAL"),
      maxResults: 2,
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).
        // console.log("From :" + response["data"]);
        var message_id = [];
        var thread_id = [];
        for (i = 0; i < 2; i++) {
          //console.log("Message: ", response.data.messages[i]);
          // message_id = response["data"]["messages"][i]["id"];
          //console.log("message_id are: " + message_id);
          String(message_id.push(response["data"]["messages"][i]["id"]));
          String(thread_id.push(response["data"]["messages"][i]["threadId"]));
        }
        var arrayLength = message_id.length;
        var arrayLengthThread = thread_id.length;
        console.log(arrayLength);
        for (let j = 0; j < arrayLengthThread; j++) {
          console.log("message_id" + j + ": " + message_id[j]);
          console.log("thread_id" + j + ": " + thread_id[j]);

          // Retreive the actual message using the message id
          gmail.users.threads.get(
            {
              auth: auth,
              userId: "me",
              //id: message_id[j]
              id: thread_id[j],
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              let from = "";
              let date = "";
              let subject = "";
              let body = "";
              let dateCheck = "";
              let msgLength = response.data.messages.length;
              //console.log("Email Body " + response.data.snippet);
              //for (let z = 0; z < arrayLength; z++) {
              //var len = response.data.payload.headers.length;
              // if (response.data.messages.length > 1) {
              //   console.log("True " + response.data.id);
              //   console.log("Length: " + response.data.messages.length);
              // }
              // } else {
              //   console.log("False");
              // }
              let headerContent =
                response.data.messages[msgLength - 1].payload.headers;
              // console.log(headerContent);
              // console.log(len);
              // for (var key in headerContent) {
              //   console.log("snippet" + headerContent[key].value);
              // }
              // const monthNames = [
              //   "January",
              //   "February",
              //   "March",
              //   "April",
              //   "May",
              //   "June",
              //   "July",
              //   "August",
              //   "September",
              //   "October",
              //   "November",
              //   "December"
              // ];
              // var dateObj = new Date();

              // // make month 2 digits (09 instead of 9) months are 0 based so note the +1
              // var month = monthNames[dateObj.getMonth()].slice(0, 3);
              // // make date 2 digits
              // var date1 = ("0" + dateObj.getDate()).slice(-2);
              // // get 4 digit year
              // var year = dateObj.getFullYear();
              // // concatenate into desired arrangement
              // var shortDate = date1 + " " + month + " " + year;
              // console.log("shortDate" + shortDate);
              for (var key in headerContent) {
                // if (headerContent[key].name == "Date") {
                //   dateCheck = headerContent[key].value.slice(4, -15);
                //   console.log("dateCheck" + dateCheck);
                //   if (dateCheck == shortDate) {
                // from = headerContent[mParts].payload.headers[0].value;
                // console.log("from" + from);
                // header = response.data.payload.headers[k].name;
                if (headerContent[key].name == "Date") {
                  date = headerContent[key].value.slice(0, -9);
                  //console.log("Date" + date);
                } else if (headerContent[key].name == "From") {
                  from = headerContent[key].value.split("<")[0];
                  //console.log("from" + from);
                } else if (headerContent[key].name == "Subject") {
                  if (headerContent[key].value.substring(0, 4) == "Fwd:") {
                    let str = headerContent[key].value;
                    subject = str.replace("Fwd:", "");
                    console.log("Loop executed");
                  } else if (
                    headerContent[key].value.substring(0, 3) == "Re:"
                  ) {
                    let str = headerContent[key].value;
                    subject = str.replace("Re:", "");
                    console.log("Loop executed");
                  } else {
                    subject = headerContent[key].value;
                    console.log("Loop not executed");
                  }
                  // console.log("subject" + subject);
                }
                //   }
                // }
              }
              // console.log(
              //   "Header: " + response.data.payload.parts[1].headers[1].value
              // );

              if (
                subject.substring(0, 4) == "Fwd:" ||
                subject.substring(0, 3) == "Re:" ||
                //   response.data.messages[z].body.data != null
                // ) {
                //   message_raw = response.data.messages[z].body.data;
                //   //console.log(message_raw);
                //   data = message_raw;
                //   buff = new Buffer(data, "base64");
                //   text = buff.toString();
                //   console.log("First loop");
                // } else if (
                // response.data.payload.parts[1].headers[1].value.match(
                //   /attachment; filename=.*/
                // ) &&
                response.data.messages[msgLength - 1].payload.parts[0]
                  .mimeType == "text/plain"
              ) {
                message_raw =
                  response.data.messages[msgLength - 1].payload.parts[0].body
                    .data;
                // console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                text = buff.toString();
                let finalText = text.split("On")[0];
                text = finalText;
                console.log("Second loop");
              } else {
                message_raw =
                  response.data.messages[msgLength - 1].payload.parts[0]
                    .parts[0].body.data;
                // console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                let attachment =
                  response.data.messages[msgLength - 1].payload.parts[1].body
                    .size / Math.pow(1024, 1);
                let shortAttach = Math.round(attachment * 100) / 100;
                text = buff.toString();
                let finalText = text.split("On")[0];
                text =
                  finalText +
                  ". " +
                  " The attachment along with this email is " +
                  response.data.messages[msgLength - 1].payload.parts[1]
                    .filename +
                  "." +
                  " The Attachment type is " +
                  response.data.messages[msgLength - 1].payload.parts[1]
                    .mimeType +
                  "." +
                  " The Attachment size is " +
                  shortAttach +
                  " MB. ";
                console.log("third loop");
                let attachId =
                  response.data.messages[msgLength - 1].payload.parts[1].body
                    .attachmentId;
                let fileN =
                  "public/doc/" +
                  response.data.messages[msgLength - 1].payload.parts[1]
                    .filename +
                  "/";
                console.log(fileN);
                gmail.users.messages.attachments.get(
                  {
                    auth: auth,
                    id: attachId,
                    messageId: response.data.messages[msgLength - 1].id,
                    userId: "me",
                  },
                  function (err, response) {
                    if (err) {
                      console.log("The API returned an error: " + err);
                      return;
                    }
                    let result = response.data.data;
                    //console.log(result);
                    let buff = new Buffer(result, "base64");
                    fs.writeFileSync(fileN, buff);

                    console.log("Base64 file data converted to file: " + fileN);
                  }
                );
                attachmentDetails(fileN).then(
                  (VisionText) => {
                    console.log("VisionText::" + VisionText);
                  },
                  (errorReason) => {
                    // code on error
                  }
                );
              }
              // VisionText = attachmentDetails("file1.pdf", function (result) {
              //   alert(result);
              // });

              //}
              //console.log(text);
              //console.log("Email Body: " + text);
              console.log("VisionText" + VisionText);
              let emailText = text.replace(/>/g, "");
              body =
                // "Pitch Rate is " +
                // pitchRate +
                //  "and Speaking Rate is " +
                //  speakingRate +
                "Email from  " +
                from +
                "." +
                " Email Subject is " +
                subject +
                "." +
                " Email date is " +
                date +
                "." +
                " Email body is " +
                emailText +
                "." +
                " Next  ";
              console.log("Email Body: " + body + "." + VisionText);

              let allData = body.substring(0, 4999);

              const client2 = new textToSpeech.TextToSpeechClient();

              const request2 = {
                // The text to synthesize
                input: {
                  text: allData,
                },

                // The language code and SSML Voice Gender
                voice: { languageCode: "en-US", name: "en-US-Wavenet-A" },

                // The audio encoding type
                audioConfig: {
                  audioEncoding: "MP3",
                  pitch: pitchRate,
                  speakingRate: speakingRate,
                },
              };

              const outputFileName2 = "public/music/email" + j + ".mp3";

              client2
                .synthesizeSpeech(request2)
                .then(async (response2) => {
                  //console.log(response);
                  const audioContent2 = _.get(response2[0], "audioContent");
                  // console.log(audioContent);
                  if (audioContent2) {
                    fs.writeFileSync(outputFileName2, audioContent2, "binary");

                    // console.log(
                    //   `Audio content successfully written to file: ${outputFileName2}`
                    // );
                  } else {
                    console.log("Failed to get audio content");
                  }
                })
                .catch((err) => {
                  console.log("ERROR:", err);
                });
            }
          );
        }
      },

      function (err) {
        console.error("Execute error", err);
      }
    );
}

function GetEmailThreadDataByName(threadName) {
  const gmail = google.gmail({ version: "v1" });
  var i;
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), function (auth) {
      return gmail.users.messages
        .list({
          auth: auth,
          userId: "me",
          labelIds: ("INBOX", "CATEGORY_PERSONAL"),
          maxResults: 3,
        })
        .then(
          function (response) {
            // Handle the results here (response.result has the parsed body).
            // console.log("From :" + response["data"]);
            var message_id = [];
            var thread_id = [];
            for (i = 0; i < 3; i++) {
              //console.log("Message: ", response.data.messages[i]);
              // message_id = response["data"]["messages"][i]["id"];
              //console.log("message_id are: " + message_id);
              // String(message_id.push(response["data"]["messages"][i]["id"]));
              String(
                thread_id.push(response["data"]["messages"][i]["threadId"])
              );
            }
            var arrayLength = message_id.length;
            var arrayLengthThread = thread_id.length;
            //console.log(arrayLengthThread);
            for (let j = 0; j < arrayLengthThread; j++) {
              //console.log("message_id" + j + ": " + message_id[j]);
              //console.log("thread_id" + j + ": " + thread_id[j]);

              // Retreive the actual message using the message id
              gmail.users.threads.get(
                {
                  auth: auth,
                  userId: "me",
                  //id: message_id[j]
                  id: thread_id[j],
                },
                function (err, response) {
                  if (err) {
                    console.log("The API returned an error: " + err);
                    return;
                  }
                  let from = "";
                  let date = "";
                  let subject = "";
                  let body = "";
                  let dateCheck = "";
                  let msgLength = response.data.messages.length;
                  let fromName = "";

                  let headerContent =
                    response.data.messages[msgLength - 1].payload.headers;
                  let fromList = [];
                  let dateList = [];
                  let subjectList = [];
                  for (var key in headerContent) {
                    if (headerContent[key].name == "From") {
                      fromName = headerContent[key].value.split("<")[0];
                      String(fromList.push(fromName));
                    } else if (headerContent[key].name == "Date") {
                      date = headerContent[key].value.slice(0, -9);
                      String(dateList.push(date));
                    } else if (headerContent[key].name == "Subject") {
                      subject = headerContent[key].value;
                      String(subjectList.push(subject));
                    }
                  }

                  // console.log("fromList" + fromList);
                  // console.log("dateList" + dateList);
                  // console.log("subjectList" + subjectList);

                  // if (fromName.match(threadName)) {
                  //   console.log("Found");
                  // } else {
                  //   console.log("Not Found");
                  // }
                  for (let k = 0; k < fromList.length; k++) {
                    if (
                      fromList[k].match(threadName) ||
                      subjectList[k].match(threadName)
                    ) {
                      console.log("Thread_id " + j + ": " + response.data.id);
                      date = dateList[k];
                      from = fromList[k];
                      if (subjectList[k].substring(0, 4) == "Fwd:") {
                        let str = subjectList[k];
                        subject = str.replace("Fwd:", "");
                        console.log("Loop executed");
                      } else if (subjectList[k].substring(0, 3) == "Re:") {
                        let str = subjectList[k];
                        subject = str.replace("Re:", "");
                        console.log("Loop executed");
                      } else {
                        subject = subjectList[k];
                        console.log("Loop not executed");
                      }

                      // for (var key in headerContent) {
                      //   // if (headerContent[key].name == "From") {
                      //   // fromName = headerContent[key].value.split("<")[0];

                      //   if (headerContent[key].name == "Date") {
                      //     date = headerContent[key].value.slice(0, -9);
                      //     //console.log("Date" + date);
                      //   } else if (headerContent[key].name == "From") {
                      //     from = headerContent[key].value.split("<")[0];
                      //     // console.log("from" + from);
                      //   } else if (headerContent[key].name == "Subject") {
                      //     if (
                      //       headerContent[key].value.substring(0, 4) == "Fwd:"
                      //     ) {
                      //       let str = headerContent[key].value;
                      //       subject = str.replace("Fwd:", "");
                      //       console.log("Loop executed");
                      //     } else if (
                      //       headerContent[key].value.substring(0, 3) == "Re:"
                      //     ) {
                      //       let str = headerContent[key].value;
                      //       subject = str.replace("Re:", "");
                      //       console.log("Loop executed");
                      //     } else {
                      //       subject = headerContent[key].value;
                      //       console.log("Loop not executed");
                      //     }
                      //     // console.log("subject" + subject);
                      //   }
                      // }
                      // console.log(
                      //   "Header: " + response.data.payload.parts[1].headers[1].value
                      // );

                      if (
                        subject.substring(0, 4) == "Fwd:" ||
                        subject.substring(0, 3) == "Re:" ||
                        //   response.data.messages[z].body.data != null
                        // ) {
                        //   message_raw = response.data.messages[z].body.data;
                        //   //console.log(message_raw);
                        //   data = message_raw;
                        //   buff = new Buffer(data, "base64");
                        //   text = buff.toString();
                        //   console.log("First loop");
                        // } else if (
                        // response.data.payload.parts[1].headers[1].value.match(
                        //   /attachment; filename=.*/
                        // ) &&
                        response.data.messages[msgLength - 1].payload.parts[0]
                          .mimeType == "text/plain"
                      ) {
                        message_raw =
                          response.data.messages[msgLength - 1].payload.parts[0]
                            .body.data;
                        // console.log(message_raw);
                        data = message_raw;
                        buff = new Buffer(data, "base64");
                        text = buff.toString();
                        let finalText = text.split("On")[0];
                        text = finalText;
                        console.log("Second loop");
                      } else {
                        message_raw =
                          response.data.messages[msgLength - 1].payload.parts[0]
                            .parts[0].body.data;
                        // console.log(message_raw);
                        data = message_raw;
                        buff = new Buffer(data, "base64");
                        let attachment =
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .body.size / Math.pow(1024, 1);
                        let shortAttach = Math.round(attachment * 100) / 100;
                        text = buff.toString();
                        let finalText = text.split("On")[0];
                        text =
                          finalText +
                          ". " +
                          " The attachment along with this email is " +
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .filename +
                          "." +
                          " The Attachment type is " +
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .mimeType +
                          "." +
                          " The Attachment size is " +
                          shortAttach +
                          " MB. ";
                        console.log("third loop");
                      }
                      //}
                      //console.log(text);
                      //console.log("Email Body: " + text);

                      let emailText = text.replace(/>/g, "");
                      body =
                        "Email from  " +
                        from +
                        "." +
                        " Email Subject is " +
                        subject +
                        "." +
                        " Email date is " +
                        date +
                        "." +
                        " Email body is " +
                        emailText +
                        "." +
                        " Next  ";
                      console.log("Email Body: " + body);

                      let allData = body.substring(0, 4999);

                      const client2 = new textToSpeech.TextToSpeechClient();

                      const request2 = {
                        // The text to synthesize
                        input: {
                          text: allData,
                        },

                        // The language code and SSML Voice Gender
                        voice: {
                          languageCode: "en-US",
                          name: "en-US-Wavenet-A",
                        },

                        // The audio encoding type
                        audioConfig: {
                          audioEncoding: "MP3",
                          pitch: 0,
                          speakingRate: 0.6,
                        },
                      };

                      const outputFileName2 = "public/music/email" + j + ".mp3";

                      client2
                        .synthesizeSpeech(request2)
                        .then(async (response2) => {
                          //console.log(response);
                          const audioContent2 = _.get(
                            response2[0],
                            "audioContent"
                          );
                          // console.log(audioContent);
                          if (audioContent2) {
                            fs.writeFileSync(
                              outputFileName2,
                              audioContent2,
                              "binary"
                            );

                            // console.log(
                            //   `Audio content successfully written to file: ${outputFileName2}`
                            // );
                          } else {
                            console.log("Failed to get audio content");
                          }
                        })
                        .catch((err) => {
                          console.log("ERROR:", err);
                        });

                      // }
                    } else {
                      console.log("Record not found!");
                    }
                  }
                }
              );
            }
          },

          function (err) {
            console.error("Execute error", err);
          }
        );
    });
  });
}

function GetEmailThreadDataByName(threadName) {
  const gmail = google.gmail({ version: "v1" });
  var i;
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), function (auth) {
      return gmail.users.messages
        .list({
          auth: auth,
          userId: "me",
          labelIds: ("INBOX", "CATEGORY_PERSONAL"),
          maxResults: 3,
        })
        .then(
          function (response) {
            // Handle the results here (response.result has the parsed body).
            // console.log("From :" + response["data"]);
            var message_id = [];
            var thread_id = [];
            for (i = 0; i < 3; i++) {
              //console.log("Message: ", response.data.messages[i]);
              // message_id = response["data"]["messages"][i]["id"];
              //console.log("message_id are: " + message_id);
              // String(message_id.push(response["data"]["messages"][i]["id"]));
              String(
                thread_id.push(response["data"]["messages"][i]["threadId"])
              );
            }
            var arrayLength = message_id.length;
            var arrayLengthThread = thread_id.length;
            //console.log(arrayLengthThread);
            for (let j = 0; j < arrayLengthThread; j++) {
              //console.log("message_id" + j + ": " + message_id[j]);
              //console.log("thread_id" + j + ": " + thread_id[j]);

              // Retreive the actual message using the message id
              gmail.users.threads.get(
                {
                  auth: auth,
                  userId: "me",
                  //id: message_id[j]
                  id: thread_id[j],
                },
                function (err, response) {
                  if (err) {
                    console.log("The API returned an error: " + err);
                    return;
                  }
                  let from = "";
                  let date = "";
                  let subject = "";
                  let body = "";
                  let dateCheck = "";
                  let msgLength = response.data.messages.length;
                  let fromName = "";

                  let headerContent =
                    response.data.messages[msgLength - 1].payload.headers;
                  let fromList = [];
                  let dateList = [];
                  let subjectList = [];
                  for (var key in headerContent) {
                    if (headerContent[key].name == "From") {
                      fromName = headerContent[key].value.split("<")[0];
                      String(fromList.push(fromName));
                    } else if (headerContent[key].name == "Date") {
                      date = headerContent[key].value.slice(0, -9);
                      String(dateList.push(date));
                    } else if (headerContent[key].name == "Subject") {
                      subject = headerContent[key].value;
                      String(subjectList.push(subject));
                    }
                  }

                  // console.log("fromList" + fromList);
                  // console.log("dateList" + dateList);
                  // console.log("subjectList" + subjectList);

                  // if (fromName.match(threadName)) {
                  //   console.log("Found");
                  // } else {
                  //   console.log("Not Found");
                  // }
                  for (let k = 0; k < fromList.length; k++) {
                    if (
                      fromList[k].match(threadName) ||
                      subjectList[k].match(threadName)
                    ) {
                      console.log("Thread_id " + j + ": " + response.data.id);
                      date = dateList[k];
                      from = fromList[k];
                      if (subjectList[k].substring(0, 4) == "Fwd:") {
                        let str = subjectList[k];
                        subject = str.replace("Fwd:", "");
                        console.log("Loop executed");
                      } else if (subjectList[k].substring(0, 3) == "Re:") {
                        let str = subjectList[k];
                        subject = str.replace("Re:", "");
                        console.log("Loop executed");
                      } else {
                        subject = subjectList[k];
                        console.log("Loop not executed");
                      }

                      // for (var key in headerContent) {
                      //   // if (headerContent[key].name == "From") {
                      //   // fromName = headerContent[key].value.split("<")[0];

                      //   if (headerContent[key].name == "Date") {
                      //     date = headerContent[key].value.slice(0, -9);
                      //     //console.log("Date" + date);
                      //   } else if (headerContent[key].name == "From") {
                      //     from = headerContent[key].value.split("<")[0];
                      //     // console.log("from" + from);
                      //   } else if (headerContent[key].name == "Subject") {
                      //     if (
                      //       headerContent[key].value.substring(0, 4) == "Fwd:"
                      //     ) {
                      //       let str = headerContent[key].value;
                      //       subject = str.replace("Fwd:", "");
                      //       console.log("Loop executed");
                      //     } else if (
                      //       headerContent[key].value.substring(0, 3) == "Re:"
                      //     ) {
                      //       let str = headerContent[key].value;
                      //       subject = str.replace("Re:", "");
                      //       console.log("Loop executed");
                      //     } else {
                      //       subject = headerContent[key].value;
                      //       console.log("Loop not executed");
                      //     }
                      //     // console.log("subject" + subject);
                      //   }
                      // }
                      // console.log(
                      //   "Header: " + response.data.payload.parts[1].headers[1].value
                      // );

                      if (
                        subject.substring(0, 4) == "Fwd:" ||
                        subject.substring(0, 3) == "Re:" ||
                        //   response.data.messages[z].body.data != null
                        // ) {
                        //   message_raw = response.data.messages[z].body.data;
                        //   //console.log(message_raw);
                        //   data = message_raw;
                        //   buff = new Buffer(data, "base64");
                        //   text = buff.toString();
                        //   console.log("First loop");
                        // } else if (
                        // response.data.payload.parts[1].headers[1].value.match(
                        //   /attachment; filename=.*/
                        // ) &&
                        response.data.messages[msgLength - 1].payload.parts[0]
                          .mimeType == "text/plain"
                      ) {
                        message_raw =
                          response.data.messages[msgLength - 1].payload.parts[0]
                            .body.data;
                        // console.log(message_raw);
                        data = message_raw;
                        buff = new Buffer(data, "base64");
                        text = buff.toString();
                        let finalText = text.split("On")[0];
                        text = finalText;
                        console.log("Second loop");
                      } else {
                        message_raw =
                          response.data.messages[msgLength - 1].payload.parts[0]
                            .parts[0].body.data;
                        // console.log(message_raw);
                        data = message_raw;
                        buff = new Buffer(data, "base64");
                        let attachment =
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .body.size / Math.pow(1024, 1);
                        let shortAttach = Math.round(attachment * 100) / 100;
                        text = buff.toString();
                        let finalText = text.split("On")[0];
                        text =
                          finalText +
                          ". " +
                          " The attachment along with this email is " +
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .filename +
                          "." +
                          " The Attachment type is " +
                          response.data.messages[msgLength - 1].payload.parts[1]
                            .mimeType +
                          "." +
                          " The Attachment size is " +
                          shortAttach +
                          " MB. ";
                        console.log("third loop");
                      }
                      //}
                      //console.log(text);
                      //console.log("Email Body: " + text);

                      let emailText = text.replace(/>/g, "");
                      body =
                        "Email from  " +
                        from +
                        "." +
                        " Email Subject is " +
                        subject +
                        "." +
                        " Email date is " +
                        date +
                        "." +
                        " Email body is " +
                        emailText +
                        "." +
                        " Next  ";
                      console.log("Email Body: " + body);

                      let allData = body.substring(0, 4999);

                      const client2 = new textToSpeech.TextToSpeechClient();

                      const request2 = {
                        // The text to synthesize
                        input: {
                          text: allData,
                        },

                        // The language code and SSML Voice Gender
                        voice: {
                          languageCode: "en-US",
                          name: "en-US-Wavenet-A",
                        },

                        // The audio encoding type
                        audioConfig: {
                          audioEncoding: "MP3",
                          pitch: 0,
                          speakingRate: 0.6,
                        },
                      };

                      const outputFileName2 = "public/music/email" + j + ".mp3";

                      client2
                        .synthesizeSpeech(request2)
                        .then(async (response2) => {
                          //console.log(response);
                          const audioContent2 = _.get(
                            response2[0],
                            "audioContent"
                          );
                          // console.log(audioContent);
                          if (audioContent2) {
                            fs.writeFileSync(
                              outputFileName2,
                              audioContent2,
                              "binary"
                            );

                            // console.log(
                            //   `Audio content successfully written to file: ${outputFileName2}`
                            // );
                          } else {
                            console.log("Failed to get audio content");
                          }
                        })
                        .catch((err) => {
                          console.log("ERROR:", err);
                        });

                      // }
                    } else {
                      console.log("Record not found!");
                    }
                  }
                }
              );
            }
          },

          function (err) {
            console.error("Execute error", err);
          }
        );
    });
  });
}

function GetEmailThreadDataCount(threadName) {
  const gmail = google.gmail({ version: "v1" });
  var i;
  let fromList = [];
  //console.log("threadName: " + threadName);
  if ("Here are the emails count from Nitish".match(threadName)) {
    console.log("threadName: " + threadName);
    updateThreadName = threadName.slice(31, 50);
    //updateThreadName = "Nitish";
    console.log("updateThreadName: " + updateThreadName);
  } else {
    console.log("Not Matched");
    updateThreadName = "";
  }
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), function (auth) {
      return gmail.users.messages
        .list({
          auth: auth,
          userId: "me",
          labelIds: ("INBOX", "CATEGORY_PERSONAL"),
          maxResults: 5,
        })
        .then(
          function (response) {
            // Handle the results here (response.result has the parsed body).
            // console.log("From :" + response["data"]);
            var message_id = [];
            var thread_id = [];
            for (i = 0; i < 5; i++) {
              String(
                thread_id.push(response["data"]["messages"][i]["threadId"])
              );
            }
            var arrayLength = message_id.length;
            var arrayLengthThread = thread_id.length;
            //console.log(arrayLengthThread);
            for (let j = 0; j < arrayLengthThread; j++) {
              // Retreive the actual message using the message id
              gmail.users.threads.get(
                {
                  auth: auth,
                  userId: "me",
                  //id: message_id[j]
                  id: thread_id[j],
                },
                function (err, response) {
                  if (err) {
                    console.log("The API returned an error: " + err);
                    return;
                  }
                  let from = "";
                  let date = "";
                  let subject = "";
                  let body = "";
                  let dateCheck = "";
                  let msgLength = response.data.messages.length;
                  let fromName = "";
                  let frName = "";
                  console.log("msgLength: " + msgLength);
                  let headerContent =
                    response.data.messages[msgLength - 1].payload.headers;

                  let dateList = [];
                  let subjectList = [];
                  for (var key in headerContent) {
                    if (headerContent[key].name == "From") {
                      fromName = headerContent[key].value.split("<")[0];
                      String(fromList.push(fromName));
                    }
                  }
                  let msgCount = [];
                  let frlist = [];
                  console.log("Thread Name:" + updateThreadName);
                  for (let k = 0; k < fromList.length; k++) {
                    if (fromList[k].match(updateThreadName)) {
                      //console.log("Thread_id " + j + ": " + response.data.id);
                      //date = dateList[k];
                      //from = fromList[k];

                      msgCount += k;
                      frname = fromList[k];
                      String(frlist.push(frname));
                    } else {
                      console.log("Record not found!");
                    }
                  }
                  console.log("Message count: " + msgCount.length);
                  console.log("Frlist: " + frlist);
                  //console.log("fromList" + fromList);
                  let allData =
                    "Total emails received from " +
                    updateThreadName +
                    " are " +
                    msgCount.length;
                  console.log("Data: " + allData);
                  if (j < 1) {
                    const client2 = new textToSpeech.TextToSpeechClient();

                    const request2 = {
                      // The text to synthesize
                      input: {
                        text: allData,
                      },

                      // The language code and SSML Voice Gender
                      voice: {
                        languageCode: "en-US",
                        name: "en-US-Wavenet-F",
                      },
                      // The audio encoding type
                      audioConfig: {
                        audioEncoding: "MP3",
                        pitch: 0,
                        speakingRate: 0.7,
                      },
                    };

                    const outputFileName2 = "public/music/email0.mp3";

                    client2
                      .synthesizeSpeech(request2)
                      .then(async (response2) => {
                        //console.log(response);
                        const audioContent2 = _.get(
                          response2[0],
                          "audioContent"
                        );
                        // console.log(audioContent);
                        if (audioContent2) {
                          fs.writeFileSync(
                            outputFileName2,
                            audioContent2,
                            "binary"
                          );

                          console.log(
                            `Audio content successfully written to file: ${outputFileName2}`
                          );
                        } else {
                          console.log("Failed to get audio content");
                        }
                      })
                      .catch((err) => {
                        console.log("ERROR:", err);
                      });
                  }
                }
              );
            }
            console.log("fromList" + fromList.length);
          },

          function (err) {
            console.error("Execute error", err);
          }
        );
    });
  });
}

function attachmentData() {
  const gmail = google.gmail({ version: "v1" });
  let attachId =
    "ANGjdJ-b8jUSnXSf9HNLgMJ-DDZD0vqc9ZMMWdz4FVCTRlTh4Dw5uKMLDkp8KEsXEE7uHtZs-bolV0DNV2cmSP8vbmk0kKW1wFrhrM-TLOZG4Jsk0oQnweSPTV-qLxmgsXDyRFS0Fxf5xXG1IQZr2GiyL2babte9mE2I2-u1zQ7dgjBuOn7Z0Og2eV5esjJTEuS7RcopO6tsN0rysQ4WxDpPHWgVB9VUUw1EL3wa10e0Fjey_riL00wJA-z-g9kkz4gPMXRTAkS2e7Hv_LcKrtEX_knFHCzQ2jW7RFuhvUvYBzZwbTJp0r61ajXqZlxF_ZfjO12-zUwjZRxrvESz60poOKz3UnnDQvkxtcHjHApLnq4T17BwJQOTuLli90vyWqtwKWTAsgVD19Q1a7oN";
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    return new Promise((resolve) => {
      try {
        authorize(JSON.parse(content), function (auth) {
          return gmail.users.messages.get(
            {
              auth: auth,
              userId: "me",
              id: "171cd676ce0e4fe0",
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              let result = response.data;
              console.log(result);
              gmail.users.messages.attachments.get(
                {
                  auth: auth,
                  id: attachId,
                  messageId: "171cd676ce0e4fe0",
                  userId: "me",
                },
                function (err, response) {
                  if (err) {
                    console.log("The API returned an error: " + err);
                    return;
                  }
                  let result = response.data.data;
                  console.log(result);
                  let buff = new Buffer(result, "base64");
                  fs.writeFileSync("public/doc/file2.pdf", buff);

                  console.log("Base64 image data converted to file: file2.pdf");
                }
              );
            }
          );
        });
      } catch (e) {}
    });
  });
}

async function attachmentDetails(param1) {
  const folderPath = "./public/doc/";
  let filelist = [];

  fs.readdirSync(folderPath).forEach((file) => {
    // console.log(file);
    String(filelist.push(file));
  });
  console.log(filelist);

  // for (let i = 0; i < filelist.length; i++) {
  let filename = param1;
  let faceExpression = "";
  var lbb = [];
  var txt = [];
  // Imports the Google Cloud client library
  const vision = require("@google-cloud/vision");

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  // Performs label detection on the image file
  const [result] = await client.labelDetection(filename);
  const labels = result.labelAnnotations;
  //console.log("Labels:");
  //labels.forEach((label) => console.log(label.description));
  //lb = label.description;
  labels.forEach((label) => String(lbb.push(label.description)));
  // console.log("lb:" + lbb);

  // Performs Text detection on the image file
  const [result1] = await client.textDetection(filename);
  const detections = result1.textAnnotations;
  //console.log("Text:");
  //detections.forEach((text) => console.log(text.description));
  detections.forEach((text) => String(txt.push(text.description)));
  // console.log("txt:" + txt);

  // client
  // .textDetection(filename)
  // .then((result1) => {
  //   const detections = result1[0].textAnnotations;
  //   console.log("Text:");
  //   detections.forEach((text) => String(txt.push(text.description)));
  //   return;
  // })
  // .catch((err) => {
  //   console.error("ERROR:", err);
  // });

  // Performs Face detection on the image file
  const [result2] = await client.faceDetection(filename);
  const faces = result2.faceAnnotations;
  // console.log("Faces:");
  faces.forEach((face, i) => {
    //   console.log(`  Face #${i + 1}:`);
    //   console.log(`    Joy: ${face.joyLikelihood}`);
    //   console.log(`    Anger: ${face.angerLikelihood}`);
    //   console.log(`    Sorrow: ${face.sorrowLikelihood}`);
    //   console.log(`    Surprise: ${face.surpriseLikelihood}`);

    if (
      `${face.joyLikelihood}` == `LIKELY` ||
      `${face.joyLikelihood}` == `VERY_LIKELY`
    ) {
      // console.log("Joy");
      faceExpression = "Joy";
    } else if (
      `${face.angerLikelihood}` == `LIKELY` ||
      `${face.angerLikelihood}` == `VERY_LIKELY`
    ) {
      // console.log("Anger");
      faceExpression = "Anger";
    } else if (
      `${face.sorrowLikelihood}` == `LIKELY` ||
      `${face.sorrowLikelihood}` == `VERY_LIKELY`
    ) {
      // console.log("Sorrow");
      faceExpression = "Sorrow";
    } else if (
      `${face.surpriseLikelihood}` == `LIKELY` ||
      `${face.surpriseLikelihood}` == `VERY_LIKELY`
    ) {
      // console.log("Surprise");
      faceExpression = "Surprise";
    } else {
      // console.log("No result found");
      faceExpression = "No face";
    }
  });

  let FinalText =
    "This attachment image has labels like " +
    lbb +
    ". It has someone face with " +
    faceExpression +
    " expression" +
    ". It has some text are " +
    txt +
    ".";

  console.log("FinalText:" + FinalText);
  // }
}

// async function attachmentDetails(param1, callback) {
//   let filename = "./public/images/Profile-Small.jpg";
//   let faceExpression = "";
//   var lbb = [];
//   var txt = [];
//   // Imports the Google Cloud client library
//   const vision = require("@google-cloud/vision");

//   // Creates a client
//   const client = new vision.ImageAnnotatorClient();

//   // Performs label detection on the image file
//   const [result] = await client.labelDetection(filename);
//   const labels = result.labelAnnotations;
//   console.log("Labels:");
//   labels.forEach((label) => console.log(label.description));
//   //lb = label.description;
//   labels.forEach((label) => String(lbb.push(label.description)));
//   //console.log("lb:" + lbb);

//   // Performs Text detection on the image file
//   const [result1] = await client.textDetection(filename);
//   const detections = result1.textAnnotations;
//   console.log("Text:");
//   detections.forEach((text) => console.log(text.description));
//   detections.forEach((text) => String(txt.push(text.description)));
//   //console.log("txt:" + txt);

//   // Performs Face detection on the image file
//   const [result2] = await client.faceDetection(filename);
//   const faces = result2.faceAnnotations;
//   console.log("Faces:");
//   faces.forEach((face, i) => {
//     console.log(`  Face #${i + 1}:`);
//     console.log(`    Joy: ${face.joyLikelihood}`);
//     console.log(`    Anger: ${face.angerLikelihood}`);
//     console.log(`    Sorrow: ${face.sorrowLikelihood}`);
//     console.log(`    Surprise: ${face.surpriseLikelihood}`);

//     if (
//       `${face.joyLikelihood}` == `LIKELY` ||
//       `${face.joyLikelihood}` == `VERY_LIKELY`
//     ) {
//       console.log("Joy");
//       faceExpression = "Joy";
//     } else if (
//       `${face.angerLikelihood}` == `LIKELY` ||
//       `${face.angerLikelihood}` == `VERY_LIKELY`
//     ) {
//       console.log("Anger");
//       faceExpression = "Anger";
//     } else if (
//       `${face.sorrowLikelihood}` == `LIKELY` ||
//       `${face.sorrowLikelihood}` == `VERY_LIKELY`
//     ) {
//       console.log("Sorrow");
//       faceExpression = "Sorrow";
//     } else if (
//       `${face.surpriseLikelihood}` == `LIKELY` ||
//       `${face.surpriseLikelihood}` == `VERY_LIKELY`
//     ) {
//       console.log("Surprise");
//       faceExpression = "Surprise";
//     } else {
//       console.log("No result found");
//       faceExpression = "No face";
//     }
//   });

//   let FinalText =
//     "This attachment image has labels like " +
//     lbb +
//     ". It has someone face with " +
//     faceExpression +
//     " expression" +
//     ". It has some text are " +
//     txt +
//     ".";

//   console.log(FinalText);

//   callback(FinalText);
// }

// let attachId =
//                 response.data.messages[msgLength - 1].payload.parts[1].body
//                   .attachmentId;
//               gmail.users.messages.attachments.get(
//                 {
//                   auth: auth,
//                   id: attachId,
//                   messageId: response.data.messages[msgLength - 1].id,
//                   userId: "me",
//                 },
//                 function (err, response) {
//                   if (err) {
//                     console.log("The API returned an error: " + err);
//                     return;
//                   }
//                   console.log("Attachment Details: " + response.data);
//                 }
//               );

//Listing on this port
const port = process.env.PORT || 8015;
app.listen(port, () => console.log(`Listning on port ${port}...`));
