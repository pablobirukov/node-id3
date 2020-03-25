const NodeID3 = require('../index.js');
const ID3Util = require('../src/ID3Util');
const assert = require('assert');
const iconv = require('iconv-lite');
const fs = require('fs');

describe('NodeID3', function () {
    describe('#create()', function () {
        it('empty tags', function () {
            assert.equal(NodeID3.create({}).compare(Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0);
        });
        it('text frames', function () {
            let tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                notfound: "notfound"
            };
            let buffer = NodeID3.create(tags);
            let titleSize = 10 + 1 + iconv.encode(tags.TIT2, ID3Util.encodingByteToString(0x01)).length;
            let albumSize = 10 + 1 + iconv.encode(tags.album, ID3Util.encodingByteToString(0x01)).length;
            assert.equal(buffer.length,
                10 + // ID3 frame header
                titleSize + // TIT2 header + encoding byte + utf16 bytes + utf16 string
                albumSize // same as above for album
            );
            // Check ID3 header
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]),
                    Buffer.from(ID3Util.encodeSize(titleSize + albumSize))
                ])
            ));
            // Check TIT2 frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x49, 0x54, 0x32]),
                    ID3Util.sizeToBuffer(titleSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.TIT2, ID3Util.encodingByteToString(0x01))
                ])
            ));
            // Check album frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x41, 0x4C, 0x42]),
                    ID3Util.sizeToBuffer(albumSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.album, ID3Util.encodingByteToString(0x01))
                ])
            ));
        });

        it('user defined text frames', function() {
            let tags = {
                userDefinedText: {
                    description: "abc",
                    value: "defg"
                }
            };
            let buffer = NodeID3.create(tags).slice(10);
            let descEncoded = iconv.encode(tags.userDefinedText.description + "\0", "UTF-16");
            let valueEncoded = iconv.encode(tags.userDefinedText.value, "UTF-16");
            assert.equal(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    ID3Util.sizeToBuffer(1 + descEncoded.length + valueEncoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    descEncoded,
                    valueEncoded
                ])
            ), 0);

            tags = {
                userDefinedText: [{
                    description: "abc",
                    value: "defg"
                }, {
                    description: "hij",
                    value: "klmn"
                }]
            };
            buffer = NodeID3.create(tags).slice(10);
            let desc1Encoded = iconv.encode(tags.userDefinedText[0].description + "\0", "UTF-16");
            let value1Encoded = iconv.encode(tags.userDefinedText[0].value, "UTF-16");
            let desc2Encoded = iconv.encode(tags.userDefinedText[1].description + "\0", "UTF-16");
            let value2Encoded = iconv.encode(tags.userDefinedText[1].value, "UTF-16");

            assert.equal(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    ID3Util.sizeToBuffer(1 + desc1Encoded.length + value1Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc1Encoded,
                    value1Encoded,
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    ID3Util.sizeToBuffer(1 + desc2Encoded.length + value2Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc2Encoded,
                    value2Encoded
                ])
            ), 0);
        });

        it('create APIC frame', function() {
            let tags = {
                picture: {
                    description: "asdf",
                    imageBuffer: Buffer.from('[0x61, 0x62, 0x63, 0x64]'),
                    mime: "jpeg",
                    type: {id: 3, name: "front cover"}
                }
            };

            assert.equal(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000003B4150494300000031000001696D6167652F6A7065670003FFFE610073006400660000005B307836312C20307836322C20307836332C20307836345D', 'hex')
            ), 0);
        });
    });

    describe('#write()', function() {
        it('sync not existing filepath', function() {
            if(!(NodeID3.write({}, './hopefullydoesnotexist.mp3') instanceof Error)) {
                assert.fail("No error thrown on non-existing filepath");
            }
        });
        it('async not existing filepath', function() {
            NodeID3.write({}, './hopefullydoesnotexist.mp3', function(err) {
                if(!(err instanceof Error)) {
                    assert.fail("No error thrown on non-existing filepath");
                }
            });
        });

        let buffer = Buffer.from([0x02, 0x06, 0x12, 0x22]);
        let tags = {title: "abc"};
        let filepath = './testfile.mp3';

        it('sync write file without id3 tag', function() {
            fs.writeFileSync(filepath, buffer, 'binary');
            NodeID3.write(tags, filepath);
            let newFileBuffer = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            assert.equal(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0);
        });
        it('async write file without id3 tag', function(done) {
            fs.writeFileSync(filepath, buffer, 'binary');
            NodeID3.write(tags, filepath, function() {
                let newFileBuffer = fs.readFileSync(filepath);
                fs.unlinkSync(filepath);
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done();
                } else {
                    done(new Error("buffer not the same"))
                }
            });
        });

        let bufferWithTag = Buffer.concat([NodeID3.create(tags), buffer]);
        tags = {album: "ix123"};

        it('sync write file with id3 tag', function() {
            fs.writeFileSync(filepath, bufferWithTag, 'binary');
            NodeID3.write(tags, filepath);
            let newFileBuffer = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            assert.equal(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0);
        });
        it('async write file with id3 tag', function(done) {
            fs.writeFileSync(filepath, bufferWithTag, 'binary');
            NodeID3.write(tags, filepath, function() {
                let newFileBuffer = fs.readFileSync(filepath);
                fs.unlinkSync(filepath);
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done();
                } else {
                    done(new Error("file written incorrectly"));
                }
            });
        });
    });

    describe('#read()', function() {
        it('read empty id3 tag', function() {
            let frame = NodeID3.create({});
            assert.deepEqual(
                NodeID3.read(frame),
                {raw: {}}
            );
        });

        it('read text frames id3 tag', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            );
        });

        it('read tag with broken frame', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[10] = 0x99;
            assert.deepEqual(
                NodeID3.read(frame),
                { album: "naBGZwssg", raw: { TALB: "naBGZwssg" }}
            );
        });

        it('read tag with broken tag', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[3] = 0x99;
            assert.deepEqual(
                NodeID3.read(frame),
                { raw: { }}
            );
        });

        it('read tag with bigger size', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[9] += 100;
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            );
        });

        it('read tag with smaller size', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[9] -= 25;
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", raw: { TIT2: "asdfghjÄÖP" }}
            );
        });

        it('read TXXX frame', function() {
            let tags = { userDefinedText: {description: "abc", value: "deg"} };
            let frame = NodeID3.create(tags);
            assert.deepEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: [tags.userDefinedText],
                    raw: {
                        TXXX: [tags.userDefinedText]
                    }
                }
            );
        });

        it('read TXXX array frame', function() {
            let tags = { userDefinedText: [{description: "abc", value: "deg"}, {description: "abcd", value: "efgh"}] };
            let frame = NodeID3.create(tags);
            assert.deepEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: tags.userDefinedText,
                    raw: {
                        TXXX: tags.userDefinedText
                    }
                }
            );
        });

        it('read APIC frame', function() {
            let withAll = Buffer.from("4944330300000000101C4150494300000016000000696D6167652F6A7065670003617364660061626364", "hex");
            let noDesc = Buffer.from("494433030000000000264150494300000012000000696D6167652F6A70656700030061626364", "hex");
            let obj = {
                description: "asdf",
                imageBuffer: Buffer.from([0x61, 0x62, 0x63, 0x64]),
                mime: "jpeg",
                type: { id: 3, name: "front cover" }
            };

            assert.deepEqual(
                NodeID3.read(withAll).picture,
                obj
            );

            obj.description = undefined;
            assert.deepEqual(
                NodeID3.read(noDesc).picture,
                obj
            );
        });
    });
});

describe('ID3Util', function () {
    describe('#removeTagFromBuffer()', function () {
        it('no tags in buffer', function () {
            let emptyBuffer = Buffer.from([0x12, 0x04, 0x05, 0x01, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27]);
            assert.equal(Buffer.compare(
                emptyBuffer,
                ID3Util.removeTagFromBuffer(emptyBuffer)
            ), 0);
        });

        it('tags at start', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72]);
            let bufferWithID3 = Buffer.concat([
                NodeID3.create({title: "abc"}),
                buffer
            ]);
            assert.equal(Buffer.compare(
                ID3Util.removeTagFromBuffer(bufferWithID3),
                buffer
            ), 0);
        });

        it('tags in middle/end', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72]);
            let bufferWithID3 = Buffer.concat([
                buffer,
                NodeID3.create({title: "abc"}),
                buffer
            ]);
            assert.equal(Buffer.compare(
                ID3Util.removeTagFromBuffer(bufferWithID3),
                Buffer.concat([buffer, buffer])
            ), 0);
        });
    });
});

/*let success = nodeID3.create({});

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