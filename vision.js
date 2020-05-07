const fs = require("fs");
var express = require("express");
var app = express();
// Imports the Google Cloud client library
const vision = require("@google-cloud/vision");
app.set("view engine", "ejs");
require("dotenv").config();

app.use(express.static(__dirname + "/views")); // html
//Access public files like css
app.use(express.static(__dirname + "/public")); // js, css, images

app.get("/vision", function (req, res) {
  //   result();
  //   test();
  //   readfile();
  attachmentDetails("file1.pdf");
  //   res.render("voice.ejs");
  res.render("demo.ejs");
  console.log("Data recieved");
});

function result() {
  attachmentDetails();
  //   console.log(" VisionText :" + VisionText);
}

async function attachmentDetails(param1) {
  const folderPath = "./public/doc/";
  let filelist = [];
  var lbb = [];
  var txt = [];
  var res = [];
  var Ino = [];
  fs.readdirSync(folderPath).forEach((file) => {
    // console.log(file);
    String(filelist.push(file));
  });
  console.log(filelist.length);

  for (var i = 0; i < filelist.length; i++) {
    let filename = "./public/doc/" + filelist[i] + "";
    let faceExpression = "";

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    // Performs label detection on the image file
    const [result] = await client.labelDetection(filename);
    const labels = result.labelAnnotations;
    //console.log("Labels:");
    labels.forEach((label) => console.log(label.description));
    //lb = label.description;
    // labels.forEach((label) => String(lbb.push(label.description)));
    // console.log("lb:" + lbb);

    // Performs Text detection on the image file
    const [result1] = await client.textDetection(filename);
    const detections = result1.textAnnotations;
    //console.log("Text:");
    detections.forEach((text) => console.log(text.description));
    // detections.forEach((text) => String(txt.push(text.description)));
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
    //  String(res.push(FinalText));
  }
  //   console.log("RES:" + res);
  //   console.log("RESLength:" + res.length);
  //   console.log("param1:" + param1);
  //return res;
}

function readfile() {
  const folderPath = "./public/doc/";
  let filelist = [];

  fs.readdirSync(folderPath).forEach((file) => {
    console.log(file);
    String(filelist.push(file));
  });
  console.log(filelist);
}

function test() {
  let res = [];
  const folderPath = "./public/doc/";
  let filelist = [];
  let Ino = [];

  fs.readdirSync(folderPath).forEach((file) => {
    // console.log(file);
    String(filelist.push(file));
  });
  console.log(filelist.length);

  for (var i = 0; i < filelist.length; i++) {
    let filename = "./public/doc/" + filelist[i] + "";
    let FinalText =
      "This attachment image has labels like " +
      ". It has someone face with " +
      " expression" +
      ". It has some text are " +
      i +
      ".";

    // console.log(FinalText);
    String(res.push(FinalText));
    String(Ino.push(filename));
    // console.log("res:" + res + "i: " + i);
  }
  console.log("RES:" + res);
  console.log("filename:" + Ino);
  console.log("RESLength:" + res.length);
}
//Listing on this port
const port = process.env.PORT || 8015;
app.listen(port, () => console.log(`Listning on port ${port}...`));
