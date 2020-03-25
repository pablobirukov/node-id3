module.exports = ID3Frame;

const ID3Util = require("./ID3Util");
const ID3FrameReader = require("./ID3FrameReader");

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

function ID3Frame(id3Tag, value = {}, identifier) {
    this.id3Tag = id3Tag;
    this.identifier = identifier;
    this.frame = {
        value: value
    };
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
    this.frame = { value: {} };
    if(buffer.length > 10) {
        this.body = buffer.slice(10, buffer.readUInt32BE(identifierSize) + 10);
        if(readerArray) {
            let frame = ID3FrameReader.buildFrame(this.body, readerArray);
            this.frame = frame || this.frame;
        }
    } else {
        this.body = Buffer.alloc(0);
    }

    return this;
};

ID3Frame.prototype.createBuffer = function(writerArray) {
    if(!this.identifier) {
        return null;
    }
    if(writerArray) {
        this.body = ID3FrameReader.buildBuffer(this.frame, writerArray);
    }
    let header = Buffer.alloc(10, 0x00);
    header.write(this.identifier, 0);
    header.writeUInt32BE(this.body.length, this.identifier.length);
    return Buffer.concat([header, this.body]);
};

module.exports.TextInformationFrame = TextInformationFrame;

function TextInformationFrame(id3Tag, value = "", identifier = "TTTT", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.frame.encodingByte = encodingByte;
    this.specification = [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
    ];
}

TextInformationFrame.prototype.loadFrom = function(buffer) {
    return ID3Frame.prototype.loadFrom.call(this, buffer, this.specification);
};

TextInformationFrame.prototype.createBuffer = function() {
    return ID3Frame.prototype.createBuffer.call(this, this.specification);
};

module.exports.UserDefinedTextFrame = UserDefinedTextFrame;

function UserDefinedTextFrame(id3Tag, value = {}, identifier = "TXXX", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.frame.encodingByte = encodingByte;
    this.specification = [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
        {name: "value.value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
    ];
}

UserDefinedTextFrame.prototype.loadFrom = function(buffer) {
    return ID3Frame.prototype.loadFrom.call(this, buffer, this.specification);
};

UserDefinedTextFrame.prototype.createBuffer = function() {
    return ID3Frame.prototype.createBuffer.call(this, this.specification);
};

module.exports.AttachedPictureFrame = AttachedPictureFrame;

function AttachedPictureFrame(id3Tag, value = {}, identifier = "APIC", encodingByte = 0x01) {
    ID3Frame.call(this, id3Tag, value, identifier);
    this.frame.encodingByte = encodingByte;
    this.specification = [
        {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.mime", func: ID3FrameReader.nullTerminated, dataType: "string"},
        {name: "value.type.id", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
        {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
        {name: "value.imageBuffer", func: ID3FrameReader.staticSize}
    ];
}

AttachedPictureFrame.prototype.loadFrom = function(buffer) {
    ID3Frame.prototype.loadFrom.call(this, buffer, this.specification);

    if(this.frame.value.type && this.frame.value.type.id) {
        this.frame.value.type.name = ID3Util.pictureTypeByteToName(this.frame.value.type.id);
    }
    if(this.frame.value.mime) {
        this.frame.value.mime = ID3Util.pictureMimeParser(this.frame.value.mime);
    }

    return this;
};

AttachedPictureFrame.prototype.createBuffer = function() {
    let mimeType = this.frame.value.mime;
    this.frame.value.mime = ID3Util.pictureMimeWriter(this.frame.value.mime);
    let buffer = ID3Frame.prototype.createBuffer.call(this, this.specification);
    this.frame.value.mime = mimeType;
    return buffer;
};