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
  player: "C:/Users/Nitish-PC/Downloads/mplayer-svn-38117/mplayer.exe"
});
var sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(":memory:");

var bodyParser = require("body-parser");

// var mongoose = require("mongoose");
// mongoose.Promise = global.Promise;
// mongoose.connect("mongodb://localhost:27017/node-demo");
//var cors = require("cors");
//app.use(cors());

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

app.get("/searchEmail", function(req, res) {
  var threadName = req.query.name;
  var threadSubject = req.query.subject;
  GetEmailThreadDataByName(threadName, threadSubject, function(messageData) {
    res.json(messageData);
  });
  res.render("test.ejs");
});

app.get("/playlist", function(req, res) {
  //res.send("EMAILS ARE:");
  // parse html forms
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getThreadEmailData);
  });

  res.render("test.ejs");
});

app.get("/check", function(req, res) {
  sqliteData();
  res.render("index.ejs");
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
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
      console.log(callback(oAuth2Client));
    });
  });
}

function getThreadEmailData(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  var i;
  let header;
  let subject;
  return gmail.users.messages
    .list({
      userId: "me",
      labelIds: ("INBOX", "CATEGORY_PERSONAL"),
      maxResults: 2
    })
    .then(
      function(response) {
        // Handle the results here (response.result has the parsed body).
        var message_id = [];
        var thread_id = [];
        for (i = 0; i < 2; i++) {
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
              id: thread_id[j]
            },
            function(err, response) {
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

              let headerContent =
                response.data.messages[msgLength - 1].payload.headers;

              for (var key in headerContent) {
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
              if (
                response.data.messages[msgLength - 1].payload.mimeType ==
                "text/html"
              ) {
                message_raw =
                  response.data.messages[msgLength - 1].payload.body.data;
                // console.log(message_raw);
                data = message_raw;
                buff = new Buffer(data, "base64");
                text = buff.toString();
                let finalText = text.split("On")[0];
                text = finalText;
                console.log("First loop");
              } else if (
                subject.substring(0, 4) == "Fwd:" ||
                subject.substring(0, 3) == "Re:" ||
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
              }

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

              db.serialize(function() {
                db.run(
                  "CREATE TABLE IF NOT EXISTS emailDB (id INTEGER,info TEXT)"
                );
                let stmt = db.prepare(
                  "INSERT INTO emailDB (id,info) VALUES(?,?)"
                );

                stmt.run(j, allData);

                stmt.finalize();

                db.each(
                  "SELECT rowid AS id, info AS info FROM emailDB",
                  function(err, row) {
                    console.log(row.id + ": " + row.info);
                  }
                );
              });

              const client2 = new textToSpeech.TextToSpeechClient();

              const request2 = {
                // The text to synthesize
                input: {
                  text: allData
                },

                // The language code and SSML Voice Gender
                voice: { languageCode: "en-US", name: "en-US-Wavenet-A" },

                // The audio encoding type
                audioConfig: {
                  audioEncoding: "MP3",
                  pitch: 0,
                  speakingRate: 0.6
                }
              };

              const outputFileName2 = "public/music/email" + j + ".mp3";

              client2
                .synthesizeSpeech(request2)
                .then(async response2 => {
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
                .catch(err => {
                  console.log("ERROR:", err);
                });
            }
          );
        }
      },

      function(err) {
        console.error("Execute error", err);
      }
    );
}

function sqliteData() {
  const db = new sqlite3.Database(":memory:", err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the database.");
  });
  //   db.serialize(function() {
  // db.run("CREATE TABLE IF NOT EXISTS emailDB (id INTEGER,info TEXT)");
  db.each("SELECT info FROM emailDB", function(err, row) {
    console.log(row.info);
  });
  //   });
  console.log("Success");
}

function GetEmailThreadDataByName(threadName, threadSubject) {
  const gmail = google.gmail({ version: "v1" });
  var i;
  let pitchRate = 0;
  let speakingRate = 0.65;

  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), function(auth) {
      return gmail.users.messages
        .list({
          auth: auth,
          userId: "me",
          labelIds: ("INBOX", "CATEGORY_PERSONAL"),
          maxResults: 5
        })
        .then(
          function(response) {
            // Handle the results here (response.result has the parsed body).
            // console.log("From :" + response["data"]);
            var message_id = [];
            var thread_id = [];
            for (i = 0; i < 5; i++) {
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
                  id: thread_id[j]
                },
                function(err, response) {
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
                  // console.log("FormList: " + fromList);
                  // console.log("SubjectList: " + subjectList);
                  // console.log("threadName: " + threadName);
                  //   function emailBodyy() {
                  //     //console.log("Thread_id " + j + ": " + response.data.id);
                  //   }
                  for (let k = 0; k < fromList.length; k++) {
                    if (fromList[k].match(threadName) && threadSubject == "") {
                      date = dateList[k];
                      from = fromList[k];
                      if (subjectList[k].substring(0, 4) == "Fwd:") {
                        let str = subjectList[k];
                        subject = str.replace("Fwd:", "");
                        // console.log("Loop executed");
                      } else if (subjectList[k].substring(0, 3) == "Re:") {
                        let str = subjectList[k];
                        subject = str.replace("Re:", "");
                        //console.log("Loop executed");
                      } else {
                        subject = subjectList[k];
                        //console.log("Loop not executed");
                      }
                      console.log("Fromlist loop");
                      if (
                        subject.substring(0, 4) == "Fwd:" ||
                        subject.substring(0, 3) == "Re:" ||
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
                        // console.log("Second loop");
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
                        // console.log("third loop");
                      }
                      //}
                      //console.log(text);
                      //console.log("Email Body: " + text);

                      let emailText = text.replace(/>/g, "");
                      body =
                        "Pitch Rate is " +
                        pitchRate +
                        "and Speaking Rate is " +
                        speakingRate +
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

                      let allData = body.substring(0, 4999);

                      console.log("Email Body: " + allData);
                      const client2 = new textToSpeech.TextToSpeechClient();

                      const request2 = {
                        // The text to synthesize
                        input: {
                          text: allData
                        },

                        // The language code and SSML Voice Gender
                        voice: {
                          languageCode: "en-US",
                          name: "en-US-Wavenet-A"
                        },

                        // The audio encoding type
                        audioConfig: {
                          audioEncoding: "MP3",
                          pitch: pitchRate,
                          speakingRate: speakingRate
                        }
                      };

                      const outputFileName2 = "public/music/email" + k + ".mp3";

                      client2
                        .synthesizeSpeech(request2)
                        .then(async response2 => {
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
                        .catch(err => {
                          console.log("ERROR:", err);
                        });
                      // }
                    } else if (
                      subjectList[k].match(threadSubject) &&
                      threadName == ""
                    ) {
                      date = dateList[k];
                      from = fromList[k];
                      if (subjectList[k].substring(0, 4) == "Fwd:") {
                        let str = subjectList[k];
                        subject = str.replace("Fwd:", "");
                        // console.log("Loop executed");
                      } else if (subjectList[k].substring(0, 3) == "Re:") {
                        let str = subjectList[k];
                        subject = str.replace("Re:", "");
                        //console.log("Loop executed");
                      } else {
                        subject = subjectList[k];
                        //console.log("Loop not executed");
                      }
                      console.log("Subjectlist loop");
                      if (
                        subject.substring(0, 4) == "Fwd:" ||
                        subject.substring(0, 3) == "Re:" ||
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
                        // console.log("Second loop");
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
                        // console.log("third loop");
                      }
                      //}
                      //console.log(text);
                      //console.log("Email Body: " + text);

                      let emailText = text.replace(/>/g, "");
                      body =
                        "Pitch Rate is " +
                        pitchRate +
                        "and Speaking Rate is " +
                        speakingRate +
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

                      let allData = body.substring(0, 4999);
                      console.log("Email Body: " + allData);
                      const client2 = new textToSpeech.TextToSpeechClient();

                      const request2 = {
                        // The text to synthesize
                        input: {
                          text: allData
                        },

                        // The language code and SSML Voice Gender
                        voice: {
                          languageCode: "en-US",
                          name: "en-US-Wavenet-A"
                        },

                        // The audio encoding type
                        audioConfig: {
                          audioEncoding: "MP3",
                          pitch: pitchRate,
                          speakingRate: speakingRate
                        }
                      };

                      const outputFileName2 = "public/music/email" + k + ".mp3";

                      client2
                        .synthesizeSpeech(request2)
                        .then(async response2 => {
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
                        .catch(err => {
                          console.log("ERROR:", err);
                        });
                    } else {
                      console.log("Record not found!");
                    }
                  }
                }
              );
            }
          },

          function(err) {
            console.error("Execute error", err);
          }
        );
    });
  });
}

//Listing on this port
const port = process.env.PORT || 8001;
app.listen(port, () => console.log(`Listning on port ${port}...`));
