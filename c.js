var lexrank = require("lexrank");
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
});
