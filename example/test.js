const nodeID3 = require('../index.js');
const fs = require('fs');


//tags.image is the path to the image (only png/jpeg files allowed)
const tags = {
  title: "Tomorrow",
  artist: "Kevin Penkin",
  album: "asdfd",
  APIC: "./example/mia_cover.jpg",
  year: 2017,
  comment: {
    language: "eng",
    text: "some text"
  },
  TRCK: "27",
  TXXX: [{
    description: "testtt.",
    value: "ja moin."
  }, {
    description: "testtt2.",
    value: "ja moin2."
  }, {
    description: "testtt3.",
    value: "ja moin3."
  }],
  private: [{
    ownerIdentifier: "AbC",
    data: "asdoahwdiohawdaw"
  }, {
    ownerIdentifier: "AbCSSS",
    data: Buffer.from([0x01, 0x02, 0x05])
  }],
  chapter: [{
    elementID: "Hey!",
    startTimeMs: 5000,
    endTimeMs: 8000,
    tags: {
      title: "abcdef",
      artist: "akshdas"
    }
  }, {
    elementID: "Hey2!",
    startTimeMs: 225000,
    endTimeMs: 8465000,
    tags: {
      artist: "abcdef222"
    }
  }]
};

let success = nodeID3.create(tags);
require('fs').writeFileSync('./example/testcreate.mp3', success, 'binary');

let fileBuffer = fs.readFileSync('./example/testcreate.mp3');

console.log(nodeID3.read('./example/testcreate.mp3'));
nodeID3.read('./example/testcreate.mp3', (err, tags) => {
    console.log(tags);
});

console.log(nodeID3.read(fileBuffer));
nodeID3.read(fileBuffer, (err, tags) => {
  console.log(tags);
});

/*let frame = (new ID3Frame()).parse(fs.readFileSync('./example/testcreate.mp3'));
console.log(frame ? frame.length : 0);
console.log(frame);

let buffer = frame.createBuffer();
if(buffer) {
    console.log(buffer);
    console.log(buffer.length);
} else {
    console.log("NOPE");
}

/*let success = nodeID3.create(tags);
require('fs').writeFileSync('./example/testcreate.mp3', success, 'binary');
console.log(success);

//console.log(nodeID3.read("./example/test.mp3").chapter[0].tags)

/*nodeID3.create(tags, function(frame) {
  console.log(frame)
})*/

//let file = fs.readFileSync("./example/Kevin Penkin - Tomorrow.mp3")
/*nodeID3.update(tags, file, function(err, buffer) {
  console.log(err)
  console.log(buffer)
})*/

//fs.writeFileSync("./example/Kevin Penkin - Tomorrow.mp3", nodeID3.update(tags, file))

//console.log(nodeID3.read("./example/example.mp3"))

//async

/*nodeID3.write(tags, "./example/Kevin Penkin - Tomorrow.mp3", function(err) {
  console.log(err)
})
*/

//console.log(nodeID3.read("./example/Kevin Penkin - Tomorrow.mp3"))


/*console.log("READING\n\n")
nodeID3.read("./example/Kevin Penkin - Tomorrow.mp3", function(err, tags) {
  console.log(err)
  console.log(tags)

  console.log("REMOVING\n\n")
  nodeID3.removeTags("./example/Kevin Penkin - Tomorrow.mp3", function(err) {
    console.log("READING\n\n")
    nodeID3.read("./example/Kevin Penkin - Tomorrow.mp3", function(err, tags) {
      console.log(err)
      console.log(tags)
    })
  })

})
*/

/*nodeID3.update({
  TXXX: [{
    description: "testtt.",
    value: "value4."
  }, {
    description: "testtt2.",
    value: "value6."
  },]
}, "./example/example.mp3", (err) => {
  console.log(nodeID3.read("./example/example.mp3"))
})*/

/*console.log(nodeID3.update({
  TXXX: [{
    description: "testtt.",
    value: "value4."
  }, {
    description: "testtt2.",
    value: "value6."
  },]
}, "./example/example.mp3"));

console.log(nodeID3.read("./example/example.mp3"))*/