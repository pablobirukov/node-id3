module.exports = ID3Frame;

const ID3Util = require("./ID3Util");
const ID3FrameReader = require("./ID3FrameReader");

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

function ID3Frame(id3Tag, value, identifier) {
    this.id3Tag = id3Tag;
    this.value = value;
    this.identifier = identifier;
}

ID3Frame.prototype.loadFrom = function(buffer, readerArray) {
    if(!buffer || buffer.length < 10 || !this.id3Tag) {
        return null;
    }

    let identifierSize;
    switch(this.id3Tag.version) {
        case 0x02:
            identifierSize = ID3V2_2_IDENTIFIER_SIZE;
            break;
        case 0x03:
            identifierSize = ID3V2_3_IDENTIFIER_SIZE;
            break;
        case 0x04:
            identifierSize = ID3V2_4_IDENTIFIER_SIZE;
            break;
        default:
            return null;
    }

    this.identifier = buffer.slice(0, identifierSize).toString();
    this.header = buffer.slice(0, 10);
    if(buffer.length > 10) {
        this.body = buffer.slice(10, buffer.readUInt32BE(identifierSize) + 10);
        if(readerArray) {
            let frame = ID3FrameReader.buildFrame(this.body, readerArray);
            Object.assign(this, frame);
        }
    } else {
        this.body = Buffer.alloc(0);
    }

    return this;
};

ID3Frame.prototype.createBuffer = function() {
    if(!this.identifier) {
        return null;
    }
    let header = Buffer.alloc(10, 0x00);
    header.write(this.identifier, 0);
    header.writeUInt32BE(this.body.length, this.identifier.length);
    return Buffer.concat([header, this.body]);
};

module.exports.TextInformationFrame = TextInformationFrame;

function TextInformationFrame(id3Tag, value = "", identifier = "TTTT", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.encodingByte = encodingByte;
}

TextInformationFrame.prototype.loadFrom = function(buffer) {
    return ID3Frame.prototype.loadFrom.call(this, buffer, [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
    ]);
};

TextInformationFrame.prototype.createBuffer = function() {
    this.body = Buffer.concat([
        Buffer.alloc(1, this.encodingByte),
        ID3Util.stringToEncodedBuffer(this.value, this.encodingByte)
    ]);
    return ID3Frame.prototype.createBuffer.call(this);
};

module.exports.UserDefinedTextFrame = UserDefinedTextFrame;

function UserDefinedTextFrame(id3Tag, value = {}, identifier = "TXXX", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.encodingByte = encodingByte;
}

UserDefinedTextFrame.prototype.loadFrom = function(buffer) {
    return ID3Frame.prototype.loadFrom.call(this, buffer, [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
        {name: "value.value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
    ]);
};

UserDefinedTextFrame.prototype.createBuffer = function() {
    this.body = Buffer.concat([
        Buffer.alloc(1, this.encodingByte),
        Buffer.from(ID3Util.stringToTerminatedBuffer(this.value.description || "", this.encodingByte)),
        ID3Util.stringToEncodedBuffer(this.value.value || "", this.encodingByte)
    ]);
    return ID3Frame.prototype.createBuffer.call(this);
};

module.exports.AttachedPictureFrame = AttachedPictureFrame;

function AttachedPictureFrame(id3Tag, value = {}, identifier = "APIC", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.encodingByte = encodingByte;
}

AttachedPictureFrame.prototype.loadFrom = function(buffer) {
    ID3Frame.prototype.loadFrom.call(this, buffer, [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.mime", func: ID3FrameReader.nullTerminated, dataType: "string"},
        {name: "value.type.id", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
        {name: "value.imageBuffer", func: ID3FrameReader.staticSize}
    ]);

    if(this.value.type && this.value.type.id) {
        this.value.type.name = ID3Util.pictureTypeByteToName(this.value.type.id);
    }
    if(this.value.mime) {
        this.value.mime = ID3Util.pictureMimeParser(this.value.mime);
    }
    return this;
};

AttachedPictureFrame.prototype.createBuffer = function() {
    this.body = Buffer.concat([
        Buffer.alloc(1, this.encodingByte),
        Buffer.from(ID3Util.stringToTerminatedBuffer(ID3Util.pictureMimeWriter(this.value.mime) || "")),
        Buffer.alloc(1, this.value.type.id || 0x00),
        Buffer.from(ID3Util.stringToTerminatedBuffer(this.value.description || "", this.encodingByte)),
        this.value.imageBuffer
    ]);
    return ID3Frame.prototype.createBuffer.call(this);
};