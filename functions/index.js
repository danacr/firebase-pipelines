const functions = require("firebase-functions");

const axios = require("axios");
const replace = require("stream-replace");
const fs = require("fs");
accessToken = functions.config().git.key;

// // old way of doing things
// accessToken = process.argv.slice(2);

dan = "danacr/drone-cloudflared/commits";
cloudflare = "cloudflare/cloudflared/tags";
github = "https://api.github.com/repos/";
readme = github + "danacr/drone-cloudflared/contents/README.md";
replaceme =
  "https://raw.githubusercontent.com/danacr/drone-cloudflared/master/REPLACE.md";
tagme = github + "danacr/drone-cloudflared/git/tags";
referenceurl = github + "danacr/drone-cloudflared/git/refs/";

var config = {
  headers: { Authorization: "bearer " + accessToken }
};

async function getLatestDan() {
  try {
    result = await axios(github + dan);
    return result.data[0].commit.message;
  } catch (error) {
    console.error(error);
  }
}
async function getLatestCF() {
  try {
    result = await axios(github + cloudflare);
    return result.data[0].name;
  } catch (error) {
    console.error(error);
  }
}

async function getsha(url) {
  try {
    result = await axios(url, config);
    return result.data.sha;
  } catch (error) {
    console.error(error);
  }
}

async function downloadreplace(url, version) {
  try {
    result = await axios(url, config);
    return result.data.replace("REPLACE_ME", version);
  } catch (error) {
    console.error(error);
  }
}

function base64_encode(file) {
  // convert binary data to base64 encoded string
  console.log("file encoded successfully");
  return new Buffer.from(file).toString("base64");
}

async function updateReadMe(url, version, newfile) {
  console.log("starting encode");
  file = base64_encode(newfile);
  console.log("getting sha");
  sha = await getsha(url);
  console.log("ready to update");
  data = {
    message: version,
    content: file,
    sha: sha
  };

  try {
    await axios.put(url, data, config);
    console.log("sent update");
  } catch (error) {
    console.error(error);
  }
}
function nowtime() {
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  return date + " " + time;
}
const compare = async () => {
  if ((await getLatestDan()) != (await getLatestCF())) {
    console.log("different");
    return true;
  } else {
    console.log(
      "Version sync OK, time: ",
      nowtime(),
      " version: ",
      await getLatestDan()
    );
    return false;
  }
};

exports.compare = functions
  .region("europe-west1")
  .pubsub.schedule("every 12 hours")
  .onRun(async context => {
    if (await compare()) {
      version = await getLatestCF();
      newfile = await downloadreplace(replaceme, version);
      console.log("time to update", version);
      await updateReadMe(readme, version, newfile);
    } else {
      console.log("nevermind...");
    }
  });

// // old way of running things
// async function main() {
//   if (await compare()) {
//     version = await getLatestCF();
//     newfile = await downloadreplace(replaceme, version);
//     console.log("time to update", version);
//     await updateReadMe(readme, version, newfile);
//   } else {
//     console.log("nevermind...");
//   }
// }
// main();
