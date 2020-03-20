module.exports = ID3Frame;

const iconv = require("iconv-lite");
const ID3Util = require("./ID3Util");

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

function ID3Frame(id3Tag, value, identifier) {
    this.id3Tag = id3Tag;
    this.value = value;
    this.identifier = identifier;
}

ID3Frame.prototype.loadFrom = function(buffer) {
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
    ID3Frame.prototype.loadFrom.call(this, buffer);
    this.encodingByte = this.body[0];
    this.value = iconv.decode(this.body.slice(1), ID3Util.encodingByteToString(this.encodingByte));
    return this;
};

TextInformationFrame.prototype.createBuffer = function() {
    this.body = Buffer.concat([
        Buffer.alloc(1, this.encodingByte),
        iconv.encode(this.value, ID3Util.encodingByteToString(this.encodingByte))
    ]);
    return ID3Frame.prototype.createBuffer.call(this);
};