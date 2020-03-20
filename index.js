module.exports = new NodeID3;

const ID3Tag = require('./src/ID3Tag');
const ID3Util = require('./src/ID3Util.js');
const fs = require('fs');

/*
**  List of non-text frames which follow their specific specification
**  name    => Frame ID
**  create  => function to create the frame
**  read    => function to read the frame
*/
/*const SFrames = {
    comment: {
        create: "createCommentFrame",
        read: "readCommentFrame",
        name: "COMM"
    },
    image: {
        create: "createPictureFrame",
        read: "readPictureFrame",
        name: "APIC"
    },
    unsynchronisedLyrics: {
        create: "createUnsynchronisedLyricsFrame",
        read: "readUnsynchronisedLyricsFrame",
        name: "USLT"
    },
    userDefinedText: {
        create: "createUserDefinedText",
        read: "readUserDefinedText",
        name: "TXXX",
        multiple: true,
        updateCompareKey: "description"
    },
    popularimeter: {
        create: "createPopularimeterFrame",
        read: "readPopularimeterFrame",
        name: "POPM"
    },
    private: {
        create: "createPrivateFrame",
        read: "readPrivateFrame",
        name: "PRIV",
        multiple: true
    },
    chapter: {
        create: "createChapterFrame",
        read: "readChapterFrame",
        name: "CHAP",
        multiple: true
    }
}

const SFramesV220 = {
    image: {
        create: "createPictureFrame",
        read: "readPictureFrame",
        name: "PIC"
    }
}

/*
**  Officially available types of the picture frame
*/
/*const APICTypes = [
	"other",
	"file icon",
	"other file icon",
	"front cover",
	"back cover",
	"leaflet page",
	"media",
	"lead artist",
	"artist",
	"conductor",
	"band",
	"composer",
	"lyricist",
	"recording location",
	"during recording",
	"during performance",
	"video screen capture",
	"a bright coloured fish",
	"illustration",
	"band logotype",
	"publisher logotype"
]
*/

function NodeID3() {
}

NodeID3.prototype.create = function(tags, fn) {
    let id3Buffer = (new ID3Tag(tags)).createBuffer();
    if(fn && typeof fn === 'function') {
        fn(id3Buffer);
    } else {
        return id3Buffer;
    }
};

NodeID3.prototype.write = function(tags, filebuffer, fn) {
    let tagBuffer = this.create(tags);
    if(filebuffer instanceof Buffer) {
        let strippedBuffer = ID3Util.removeTagFromBuffer(filebuffer) || filebuffer;
        let completeBuffer = Buffer.concat([tagBuffer, strippedBuffer]);
        if(fn && typeof fn === 'function') {
            fn(null, completeBuffer);
            return;
        } else {
            return completeBuffer;
        }
    }

    if(fn && typeof fn === 'function') {
        try {
            fs.readFile(filebuffer, function(err, data) {
                if(err) {
                    fn(err);
                    return;
                }
                let strippedBuffer = ID3Util.removeTagFromBuffer(data) || data;
                let completeBuffer = Buffer.concat([tagBuffer, strippedBuffer]);
                fs.writeFile(filebuffer, completeBuffer, 'binary', function(err) {
                    fn(err);
                });
            });
        } catch(err) {
            fn(err);
        }
    } else {
        try {
            let data = fs.readFileSync(filebuffer);
            let strippedBuffer = ID3Util.removeTagFromBuffer(data) || data;
            let completeBuffer = Buffer.concat([tagBuffer, strippedBuffer]);
            fs.writeFileSync(filebuffer, completeBuffer, 'binary');
            return true;
        } catch(err) {
            return err;
        }
    }
};

NodeID3.prototype.read = function(filebuffer, fn) {
    let tag = new ID3Tag();
    if(!fn || typeof fn !== 'function') {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            filebuffer = fs.readFileSync(filebuffer)
        }
        tag.loadFrom(filebuffer);
        return tag.getTags();
    } else {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            fs.readFile(filebuffer, function(err, data) {
                if(err) {
                    fn(err, null);
                } else {
                    tag.loadFrom(data);
                    fn(null, tag.getTags());
                }
            }.bind(this))
        } else {
            tag.loadFrom(filebuffer);
            fn(null, tag.getTags());
        }
    }
};

/*NodeID3.prototype.createBuffersFromTags = function(tags) {
    let frames = []
    let tagNames = Object.keys(tags)

    tagNames.forEach(function (tag, index) {
        //  Check if passed tag is text frame (Alias or ID)
        let frame
        if (TFrames[tag] || Object.keys(TFrames).map(i => TFrames[i]).indexOf(tag) != -1) {
            let specName = TFrames[tag] || tag
            frame = this.createTextFrame(specName, tags[tag])
        } else if (SFrames[tag]) {  //  Check if Alias of special frame
            let createFrameFunction = SFrames[tag].create
            frame = this[createFrameFunction](tags[tag])
        } else if (Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tag) != -1) {  //  Check if ID of special frame
            //  get create function from special frames where tag ID is found at SFrame[index].name
            let createFrameFunction = SFrames[Object.keys(SFrames)[Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tag)]].create
            frame = this[createFrameFunction](tags[tag])
        }

        if (frame instanceof Buffer) {
            frames.push(frame)
        }
    }.bind(this))

    return frames
}*/

/*
**  Update ID3-Tags from passed buffer/filepath
**  filebuffer  => Buffer || String
**  tags        => Object
**  fn          => function (for asynchronous usage)
*/
/*NodeID3.prototype.update = function(tags, filebuffer, fn) {
    let rawTags = {}
    let SRawToNameMap = {}
    Object.keys(SFrames).map((key, index) => {
        SRawToNameMap[SFrames[key].name] = key
    })
    Object.keys(tags).map(function(tagKey) {
        //  if js name passed (TF)
        if(TFrames[tagKey]) {
            rawTags[TFrames[tagKey]] = tags[tagKey]

        //  if js name passed (SF)
        } else if(SFrames[tagKey]) {
            rawTags[SFrames[tagKey].name] = tags[tagKey]

        //  if raw name passed (TF)
        } else if(Object.keys(TFrames).map(i => TFrames[i]).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]

        //  if raw name passed (SF)
        } else if(Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]
        }
    })
    if(!fn || typeof fn !== 'function') {
        let currentTags = this.read(filebuffer)
        currentTags = currentTags.raw || {}
        //  update current tags with new or keep them
        Object.keys(rawTags).map(function(tag) {
            if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                cCompare = {}
                currentTags[tag].forEach((cTag, index) => {
                    cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                })
                if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                rawTags[tag].forEach((rTag, index) => {
                    let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                    if(comparison !== undefined) {
                        currentTags[tag][comparison] = rTag
                    } else {
                        currentTags[tag].push(rTag)
                    }
                })
            } else {
                currentTags[tag] = rawTags[tag]
            }
        })
        return this.write(currentTags, filebuffer)
    } else {
        this.read(filebuffer, function(err, currentTags) {
            if(err) {
                fn(err)
                return
            }
            currentTags = currentTags.raw || {}
            //  update current tags with new or keep them
            Object.keys(rawTags).map(function(tag) {
                if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                    cCompare = {}
                    currentTags[tag].forEach((cTag, index) => {
                        cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                    })
                    if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                    rawTags[tag].forEach((rTag, index) => {
                        let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                        if(comparison !== undefined) {
                            currentTags[tag][comparison] = rTag
                        } else {
                            currentTags[tag].push(rTag)
                        }
                    })
                } else {
                    currentTags[tag] = rawTags[tag]
                }
            })
            this.write(currentTags, filebuffer, fn)
        }.bind(this))
    }
}*/

/*
**  Read ID3-Tags from passed buffer
**  filebuffer  => Buffer
**  options     => Object
*/
/*NodeID3.prototype.getTagsFromBuffer = function(filebuffer, options) {
    let framePosition = this.getFramePosition(filebuffer)
    if(framePosition === -1) {
        return false
    }
    let frameSize = this.getTagSize(Buffer.from(filebuffer.toString('hex', framePosition, framePosition + 10), "hex")) + 10
    let ID3Frame = Buffer.alloc(frameSize + 1)
    let ID3FrameBody = Buffer.alloc(frameSize - 10 + 1)
    filebuffer.copy(ID3Frame, 0, framePosition)
    filebuffer.copy(ID3FrameBody, 0, framePosition + 10)

    //ID3 version e.g. 3 if ID3v2.3.0
    let ID3Version = ID3Frame[3]
    let identifierSize = 4
    let textframeHeaderSize = 10
    if(ID3Version == 2) {
        identifierSize = 3
        textframeHeaderSize = 6
    }

    let frames = this.getFramesFromID3Body(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize)

    return this.getTagsFromFrames(frames, ID3Version)
}*/

/*NodeID3.prototype.getFramesFromID3Body = function(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize) {
    let currentPosition = 0
    let frames = []
    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        let bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
        ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

        let decodeSize = false
        if(ID3Version == 4) {
            decodeSize = true
        }
        let bodyFrameSize = this.getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
        if(bodyFrameSize > (ID3FrameBody.length - currentPosition)) {
            break
        }
        let bodyFrameBuffer = Buffer.alloc(bodyFrameSize)
        ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize)
        //  Size of sub frame + its header
        currentPosition += bodyFrameSize + textframeHeaderSize
        frames.push({
            name: bodyFrameHeader.toString('utf8', 0, identifierSize),
            body: bodyFrameBuffer
        })
    }

    return frames
}*/

/*NodeID3.prototype.getTagsFromFrames = function(frames, ID3Version) {
    let tags = { raw: {} }

    frames.forEach(function(frame, index) {
        //  Check first character if frame is text frame
        if(frame.name[0] === "T" && frame.name !== "TXXX") {
            //  Decode body
            let decoded
            if(frame.body[0] === 0x01) {
                decoded = iconv.decode(frame.body.slice(1), "utf16").replace(/\0/g, "")
            } else {
                decoded = iconv.decode(frame.body.slice(1), "ISO-8859-1").replace(/\0/g, "")
            }
            tags.raw[frame.name] = decoded
            let versionFrames = TFrames
            if(ID3Version == 2) {
                versionFrames = TFramesV220
            }
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key] === frame.name) {
                    tags[key] = decoded
                }
            })
        } else {
            let versionFrames = SFrames
            if(ID3Version == 2) {
                versionFrames = SFramesV220
            }
            //  Check if non-text frame is supported
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key].name === frame.name) {
                    let decoded = this[versionFrames[key].read](frame.body, ID3Version)
                    if(versionFrames[key].multiple) {
                        if(!tags[key]) tags[key] = []
                        if(!tags.raw[frame.name]) tags.raw[frame.name] = []
                        tags.raw[frame.name].push(decoded)
                        tags[key].push(decoded)
                    } else {
                        tags.raw[frame.name] = decoded
                        tags[key] = decoded
                    }
                }
            }.bind(this))
        }
    }.bind(this))

    return tags
}*/

/*
**  Get position of ID3-Frame, returns -1 if not found
**  buffer  => Buffer
*/
/*NodeID3.prototype.getFramePosition = function(buffer) {
    let framePosition = buffer.indexOf("ID3")
    if(framePosition == -1 || framePosition > 20) {
        return -1
    } else {
        return framePosition
    }
}*/

/*
**  Get size of tag from header
**  buffer  => Buffer/Array (header)
*/
/*NodeID3.prototype.getTagSize = function(buffer) {
    return this.decodeSize(Buffer.from([buffer[6], buffer[7], buffer[8], buffer[9]]))
}*/

/*
**  Get size of frame from header
**  buffer  => Buffer/Array (header)
**  decode  => Boolean
*/
/*NodeID3.prototype.getFrameSize = function(buffer, decode, ID3Version) {
    let decodeBytes
    if(ID3Version > 2) {
        decodeBytes = [buffer[4], buffer[5], buffer[6], buffer[7]]
    } else {
        decodeBytes = [buffer[3], buffer[4], buffer[5]]
    }
    if(decode) {
        return this.decodeSize(Buffer.from(decodeBytes))
    } else {
        return Buffer.from(decodeBytes).readUIntBE(0, decodeBytes.length)
    }
}*/

/*
**  Checks and removes already written ID3-Frames from a buffer
**  data => buffer
*/
/*NodeID3.prototype.removeTagsFromBuffer = function(data) {
    let framePosition = this.getFramePosition(data)

    if(framePosition == -1) {
        return data
    }

    let hSize = Buffer.from([data[framePosition + 6], data[framePosition + 7], data[framePosition + 8], data[framePosition + 9]])

    if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
        //  Invalid tag size (msb not 0)
        return false
    }

    let size = this.decodeSize(hSize)
    return data.slice(framePosition + size + 10)
}*/

/*
**  Checks and removes already written ID3-Frames from a file
**  data => buffer
*/
/*NodeID3.prototype.removeTags = function(filepath, fn) {
    if(!fn || typeof fn !== 'function') {
        let data
        try {
            data = fs.readFileSync(filepath)
        } catch(e) {
            return e
        }

        let newData = this.removeTagsFromBuffer(data)
        if(!newData) {
            return false
        }

        try {
            fs.writeFileSync(filepath, newData, 'binary')
        } catch(e) {
            return e
        }

        return true
    } else {
        fs.readFile(filepath, function(err, data) {
            if(err) {
                fn(err)
            }

            let newData = this.removeTagsFromBuffer(data)
            if(!newData) {
                fn(err)
                return
            }

            fs.writeFile(filepath, newData, 'binary', function(err) {
                if(err) {
                    fn(err)
                } else {
                    fn(false)
                }
            })
        }.bind(this))
    }
}*/

/*
**  data => string || buffer
*/
/*NodeID3.prototype.createPictureFrame = function(data) {
    try {
        if(data && data.imageBuffer && data.imageBuffer instanceof Buffer === true) {
            data = data.imageBuffer
        }
        let apicData = (data instanceof Buffer == true) ? Buffer.from(data) : Buffer.from(fs.readFileSync(data, 'binary'), 'binary')
        let bHeader = Buffer.alloc(10)
        bHeader.fill(0)
        bHeader.write("APIC", 0)

    	let mime_type = "image/png"

        if(apicData[0] == 0xff && apicData[1] == 0xd8 && apicData[2] == 0xff) {
            mime_type = "image/jpeg"
        }

        let bContent = Buffer.alloc(mime_type.length + 4)
        bContent.fill(0)
        bContent[mime_type.length + 2] = 0x03                           //  Front cover
        bContent.write(mime_type, 1)

    	bHeader.writeUInt32BE(apicData.length + bContent.length, 4)     //  Size of frame

        return Buffer.concat([bHeader, bContent, apicData])
    } catch(e) {
        return e
    }
}

/*
**  data => buffer
*/
/*NodeID3.prototype.readPictureFrame = function(APICFrame, ID3Version) {
    let picture = {}

    let APICMimeType
    if(ID3Version == 2) {
        APICMimeType = APICFrame.toString('ascii').substring(1, 4)
    } else {
        APICMimeType = APICFrame.toString('ascii').substring(1, APICFrame.indexOf(0x00, 1))
    }

    if(APICMimeType == "image/jpeg") {
        picture.mime = "jpeg"
    } else if(APICMimeType == "image/png") {
        picture.mime = "png"
    } else {
        picture.mime = APICMimeType
    }

    picture.type = {}
    if(ID3Version == 2 && APICTypes.length < APICFrame[4]) {
        picture.type = {
            id: APICFrame[4],
            name: APICTypes[APICFrame[4]]
        }
    } else {
        picture.type = {
            id: APICFrame[APICFrame.indexOf(0x00, 1) + 1],
            name: APICTypes[APICFrame[APICFrame.indexOf(0x00, 1) + 1]]
        }
    }

    let descEnd
    if(APICFrame[0] == 0x00) {
        if(ID3Version == 2) {
            picture.description = iconv.decode(APICFrame.slice(5, APICFrame.indexOf(0x00, 5)), "ISO-8859-1") || undefined
            descEnd = APICFrame.indexOf(0x00, 5)
        } else {
            picture.description = iconv.decode(APICFrame.slice(APICFrame.indexOf(0x00, 1) + 2, APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2)), "ISO-8859-1") || undefined
            descEnd = APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2)
        }
    } else if (APICFrame[0] == 0x01) {
        if(ID3Version == 2) {
            let descOffset = 5
            let desc = APICFrame.slice(descOffset)
            let descFound = desc.indexOf("0000", 0, 'hex')
            descEnd = descOffset + descFound + 2

            if(descFound != -1) {
                picture.description = iconv.decode(desc.slice(0, descFound + 2), 'utf16') || undefined
            }
        } else {
            let descOffset = APICFrame.indexOf(0x00, 1) + 2
            let desc = APICFrame.slice(descOffset)
            let descFound = desc.indexOf("0000", 0, 'hex')
            descEnd = descOffset + descFound + 2

            if(descFound != -1) {
                picture.description = iconv.decode(desc.slice(0, descFound + 2), 'utf16') || undefined
            }
        }
    }
    if(descEnd) {
        picture.imageBuffer = APICFrame.slice(descEnd + 1)
    } else {
        picture.imageBuffer = APICFrame.slice(5)
    }

    return picture
}

NodeID3.prototype.getEncodingByte = function(encoding) {
    if(!encoding || encoding === 0x00 || encoding === "ISO-8859-1") {
        return 0x00
    } else {
        return 0x01
    }
}

NodeID3.prototype.getEncodingName = function(encoding) {
    if(this.getEncodingByte(encoding) === 0x00) {
        return "ISO-8859-1"
    } else {
        return "utf16"
    }
}

NodeID3.prototype.getTerminationCount = function(encoding) {
    if(encoding === 0x00) {
        return 1
    } else {
        return 2
    }
}

NodeID3.prototype.createTextEncoding = function(encoding) {
    let buffer = Buffer.alloc(1)
    buffer[0] = this.getEncodingByte(encoding)
    return buffer
}

NodeID3.prototype.createLanguage = function(language) {
    if(!language) {
        language = "eng"
    } else if(language.length > 3) {
        language = language.substring(0, 3)
    }

    return Buffer.from(language)
}

NodeID3.prototype.createContentDescriptor = function(description, encoding, terminated) {
    if(!description) {
        description = terminated ? iconv.encode("\0", this.getEncodingName(encoding)) : Buffer.alloc(0)
        return description
    }

    description = iconv.encode(description, this.getEncodingName(encoding))

    return terminated ? Buffer.concat([description, Buffer.alloc(this.getTerminationCount(encoding)).fill(0x00)]) : description
}

NodeID3.prototype.createText = function(text, encoding, terminated) {
    if(!text) {
        text = ""
    }

    text = iconv.encode(text, this.getEncodingName(encoding))

    return terminated ? Buffer.concat([text, Buffer.from(this.getTerminationCount(encoding)).fill(0x00)]) : text
}

/*
**  comment => object {
**      language:   string (3 characters),
**      text:       string
**      shortText:  string
**  }
**/
/*NodeID3.prototype.createCommentFrame = function(comment) {
    comment = comment || {}
    if(!comment.text) {
        return null
    }

    // Create frame header
    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write("COMM", 0)                 //  Write header ID

    let encodingBuffer = this.createTextEncoding(0x01)
    let languageBuffer = this.createLanguage(comment.language)
    let descriptorBuffer = this.createContentDescriptor(comment.shortText, 0x01, true)
    let textBuffer = this.createText(comment.text, 0x01, false)

    buffer.writeUInt32BE(encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length, 4)
    return Buffer.concat([buffer, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readCommentFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            language: iconv.decode(frame, "ISO-8859-1").substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(frame, "ISO-8859-1").substring(4, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            text: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let shortText = frame.slice(4, descriptorEscape)
        let text = frame.slice(descriptorEscape + 2)

        tags = {
            language: frame.toString().substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(shortText, "utf16").replace(/\0/g, ""),
            text: iconv.decode(text, "utf16").replace(/\0/g, "")
        }
    }

    return tags
}

/*
**  unsynchronisedLyrics => object {
**      language:   string (3 characters),
**      text:       string
**      shortText:  string
**  }
**/
/*NodeID3.prototype.createUnsynchronisedLyricsFrame = function(unsynchronisedLyrics) {
    unsynchronisedLyrics = unsynchronisedLyrics || {}
    if(typeof unsynchronisedLyrics === 'string' || unsynchronisedLyrics instanceof String) {
        unsynchronisedLyrics = {
            text: unsynchronisedLyrics
        }
    }
    if(!unsynchronisedLyrics.text) {
        return null
    }

    // Create frame header
    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write("USLT", 0)                 //  Write header ID

    let encodingBuffer = this.createTextEncoding(0x01)
    let languageBuffer = this.createLanguage(unsynchronisedLyrics.language)
    let descriptorBuffer = this.createContentDescriptor(unsynchronisedLyrics.shortText, 0x01, true)
    let textBuffer = this.createText(unsynchronisedLyrics.text, 0x01, false)

    buffer.writeUInt32BE(encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length, 4)
    return Buffer.concat([buffer, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readUnsynchronisedLyricsFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            language: iconv.decode(frame, "ISO-8859-1").substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(frame, "ISO-8859-1").substring(4, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            text: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let shortText = frame.slice(4, descriptorEscape)
        let text = frame.slice(descriptorEscape + 2)

        tags = {
            language: frame.toString().substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(shortText, "utf16").replace(/\0/g, ""),
            text: iconv.decode(text, "utf16").replace(/\0/g, "")
        }
    }

    return tags
}

/*
**  comment => object / array of objects {
**      description:    string
**      value:          string
**  }
**/
/*NodeID3.prototype.createUserDefinedText = function(userDefinedText, recursiveBuffer) {
    udt = userDefinedText || {}
    if(udt instanceof Array && udt.length > 0) {
        if(!recursiveBuffer) {
            // Don't alter passed array value!
            userDefinedText = userDefinedText.slice(0)
        }
        udt = userDefinedText.pop()
    }

    if(udt && udt.description) {
        // Create frame header
        let buffer = Buffer.alloc(10)
        buffer.fill(0)
        buffer.write("TXXX", 0)                 //  Write header ID

        let encodingBuffer = this.createTextEncoding(0x01)
        let descriptorBuffer = this.createContentDescriptor(udt.description, 0x01, true)
        let valueBuffer = this.createText(udt.value, 0x01, false)

        buffer.writeUInt32BE(encodingBuffer.length + descriptorBuffer.length + valueBuffer.length, 4)
        if(!recursiveBuffer) {
            recursiveBuffer = Buffer.concat([buffer, encodingBuffer, descriptorBuffer, valueBuffer])
        } else {
            recursiveBuffer = Buffer.concat([recursiveBuffer, buffer, encodingBuffer, descriptorBuffer, valueBuffer])
        }
    }
    if(userDefinedText instanceof Array && userDefinedText.length > 0) {
        return this.createUserDefinedText(userDefinedText, recursiveBuffer)
    } else {
        return recursiveBuffer
    }
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readUserDefinedText = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            description: iconv.decode(frame, "ISO-8859-1").substring(1, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            value: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let description = frame.slice(1, descriptorEscape)
        let value = frame.slice(descriptorEscape + 2)

        tags = {
            description: iconv.decode(description, "utf16").replace(/\0/g, ""),
            value: iconv.decode(value, "utf16").replace(/\0/g, "")
        }
    }

    return tags
}

/*
**  popularimeter => object {
**      email:    string,
**      rating:   int
**      counter:  int
**  }
**/
/*NodeID3.prototype.createPopularimeterFrame = function(popularimeter) {
    popularimeter = popularimeter || {}
    let email = popularimeter.email
    let rating = Math.trunc(popularimeter.rating)
    let counter = Math.trunc(popularimeter.counter)
    if(!email) {
        return null
    }
    if(isNaN(rating) || rating < 0 || rating > 255) {
        rating = 0
    }
    if(isNaN(counter) || counter < 0) {
        counter = 0
    }

    // Create frame header
    let buffer = Buffer.alloc(10, 0)
    buffer.write("POPM", 0)                 //  Write header ID

    let emailBuffer = this.createText(email, 0x01, false)
    emailBuffer = Buffer.from(email + '\0', 'utf8')
    let ratingBuffer = Buffer.alloc(1, rating)
    let counterBuffer = Buffer.alloc(4, 0)
    counterBuffer.writeUInt32BE(counter, 0)

    buffer.writeUInt32BE(emailBuffer.length + ratingBuffer.length + counterBuffer.length, 4)
    var frame = Buffer.concat([buffer, emailBuffer, ratingBuffer, counterBuffer])
    return frame
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readPopularimeterFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    let endEmailIndex = frame.indexOf(0x00, 1)
    if(endEmailIndex > -1) {
        tags.email = iconv.decode(frame.slice(0, endEmailIndex), "ISO-8859-1")
        let ratingIndex = endEmailIndex + 1
        if(ratingIndex < frame.length) {
            tags.rating = frame[ratingIndex]
            let counterIndex = ratingIndex + 1
            if(counterIndex < frame.length) {
                let value = frame.slice(counterIndex, frame.length)
                if(value.length >= 4) {
                    tags.counter = value.readUInt32BE()
                }
            }
        }
    }
    return tags
}

/*
**  private => object|array {
**      ownerIdentifier:    string,
**      data:   buffer|string
**  }
**/
/*NodeID3.prototype.createPrivateFrame = function(private) {
    if(private instanceof Array && private.length > 0) {
        let frames = []
        private.forEach(tag => {
            let frame = this.createPrivateFrameHelper(tag)
            if(frame) {
                frames.push(frame)
            }
        })
        return frames.length ? Buffer.concat(frames) : null
    } else {
        return this.createPrivateFrameHelper(private)
    }
}

NodeID3.prototype.createPrivateFrameHelper = function(private) {
    if(!private || !private.ownerIdentifier || !private.data) {
        return null;
    }
    let header = Buffer.alloc(10, 0)
    header.write("PRIV")
    let ownerIdentifier = Buffer.from(private.ownerIdentifier + "\0", "utf8")
    let data
    if(typeof(private.data) == "string") {
        data = Buffer.from(private.data, "utf8")
    } else {
        data = private.data
    }

    header.writeUInt32BE(ownerIdentifier.length + data.length, 4)
    return Buffer.concat([header, ownerIdentifier, data])
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readPrivateFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }

    let endOfOwnerIdentification = frame.indexOf(0x00)
    if(endOfOwnerIdentification == -1) {
        return tags
    }

    tags.ownerIdentifier = iconv.decode(frame.slice(0, endOfOwnerIdentification), "ISO-8859-1")

    if(frame.length <= endOfOwnerIdentification + 1) {
        return tags
    }

    tags.data = frame.slice(endOfOwnerIdentification + 1)

    return tags
}


/*
**  chapter => object|array {
**      startTimeMs:    number,
**      endTimeMs:   number,
**      startOffsetBytes: number,
**      endOffsetBytes: number,
**      tags: object
**  }
**/
/*NodeID3.prototype.createChapterFrame = function(chapter) {
    if(chapter instanceof Array && chapter.length > 0) {
        let frames = []
        chapter.forEach((tag, index) => {
            let frame = this.createChapterFrameHelper(tag, index + 1)
            if(frame) {
                frames.push(frame)
            }
        })
        return frames.length ? Buffer.concat(frames) : null
    } else {
        return this.createChapterFrameHelper(chapter, 1)
    }
}

NodeID3.prototype.createChapterFrameHelper = function(chapter, id) {
    if(!chapter || !chapter.elementID || !chapter.startTimeMs || !chapter.endTimeMs) {
        return null
    }

    let header = Buffer.alloc(10, 0)
    header.write("CHAP")

    let elementIDBuffer = Buffer.from(chapter.elementID + "\0")
    let startTimeBuffer = Buffer.alloc(4)
    startTimeBuffer.writeUInt32BE(chapter.startTimeMs)
    let endTimeBuffer = Buffer.alloc(4)
    endTimeBuffer.writeUInt32BE(chapter.endTimeMs)
    let startOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if(chapter.startOffsetBytes) {
        startOffsetBytesBuffer.writeUInt32BE(chapter.startOffsetBytes)
    }
    let endOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if(chapter.endOffsetBytes) {
        endOffsetBytesBuffer.writeUInt32BE(chapter.endOffsetBytes)
    }

    let frames
    if(chapter.tags) {
        frames = this.createBuffersFromTags(chapter.tags)
    }
    framesBuffer = frames ? Buffer.concat(frames) : Buffer.alloc(0)

    header.writeUInt32BE(elementIDBuffer.length + 16 + framesBuffer.length, 4)
    return Buffer.concat([header, elementIDBuffer, startTimeBuffer, endTimeBuffer, startOffsetBytesBuffer, endOffsetBytesBuffer, framesBuffer])
}

/*
**  frame   => Buffer
*/
/*NodeID3.prototype.readChapterFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }

    let endOfElementIDString = frame.indexOf(0x00)
    if(endOfElementIDString == -1 || frame.length - endOfElementIDString - 1 < 16) {
        return tags
    }

    tags.elementID = iconv.decode(frame.slice(0, endOfElementIDString), "ISO-8859-1")
    tags.startTimeMs = frame.readUInt32BE(endOfElementIDString + 1)
    tags.endTimeMs = frame.readUInt32BE(endOfElementIDString + 5)
    if(frame.readUInt32BE(endOfElementIDString + 9) != Buffer.alloc(4, 0xff).readUInt32BE()) {
        tags.startOffsetBytes = frame.readUInt32BE(endOfElementIDString + 9)
    }
    if(frame.readUInt32BE(endOfElementIDString + 13) != Buffer.alloc(4, 0xff).readUInt32BE()) {
        tags.endOffsetBytes = frame.readUInt32BE(endOfElementIDString + 13)
    }

    if(frame.length - endOfElementIDString - 17 > 0) {
        let framesBuffer = frame.slice(endOfElementIDString + 17)
        tags.tags = this.getTagsFromFrames(this.getFramesFromID3Body(framesBuffer, 3, 4, 10), 3)
    }

    return tags
}
*/
