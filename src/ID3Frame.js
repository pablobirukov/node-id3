const iconv = require("iconv-lite");
const ID3Util = require("./ID3Util");

module.exports = ID3Frame;

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

function ID3Frame(id3Tag, identifier, body) {
    this.id3Tag = id3Tag;
    this.identifier = identifier;
    this.body = body;
}

ID3Frame.prototype.parse = function(buffer) {
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

    this.identifier = buffer.slice(0, identifierSize);
    if(buffer.length > 10) {
        this.body = buffer.slice(10, buffer.readUInt32BE(identifierSize) + 10);
    }

    return this;
};

ID3Frame.prototype.createFrameBuffer = function() {
    if(!this.identifier) {
        return null;
    }
    let header = Buffer.alloc(10, 0x00);
    header.write(this.identifier, 0);
    header.writeUInt32BE(this.body.length, this.identifier.length);
    return Buffer.concat([header, this.body]);
};

function TextInformationFrame(identifier, encodingByte, text) {
    this.identifier = identifier;
    this.encodingByte = encodingByte;
    this.text = text;
}

TextInformationFrame.prototype.parse = function(body) {
    this.encodingByte = body[0];
    this.text = iconv.decode(body.slice(1), ID3Util.parseEncodingByte(this.encodingByte));
    return this;
};

TextInformationFrame.prototype.createFrameBuffer = function() {
    let body = Buffer.concat([
        Buffer.alloc(1, this.encodingByte),
        iconv.encode(this.text, ID3Util.parseEncodingByte(this.encodingByte))
    ]);
    return (new ID3Frame(null, this.identifier, body)).createFrameBuffer();
};