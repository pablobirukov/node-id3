const fs = require('fs');
const ID3Frame = require('ID3Frame');

module.exports = ID3Tag;

function ID3Tag(version, flags = {}, size, body) {
    this.version = version;
    this.flags = flags;
    this.size = size;
    this.body = body;
}

/**
 *
 * @return {this, null}
 */
ID3Tag.prototype.load = function(buffer) {
    /* Search Buffer for valid ID3 frame */
    let framePosition = -1;
    let frameHeaderValid = false;
    do {
        framePosition = buffer.indexOf("ID3", framePosition + 1);
        if(framePosition !== -1) {
            /* It's possible that there is a "ID3" sequence without being an ID3 Frame,
             * so we need to check for validity of the next 10 bytes
             */
            frameHeaderValid = this.IsValidID3Header(buffer.slice(framePosition, framePosition + 10));
        }
    } while (framePosition !== -1 && !frameHeaderValid);

    if(!frameHeaderValid) {
        return null;
    } else {
        this.version = buffer[framePosition + 3];
        let flagByte = buffer[framePosition + 5];
        // Flag bits from 0 - 7
        this.flags = {
            // Bit 7
            unsynchronisation: flagByte & 128,
            // Bit 6
            extendedHeader: flagByte & 64,
            // Bit 5
            experimentalIndicator: flagByte & 32,
            // Bit 4
            footerPresent: flagByte & 16
        };
        this.size = this.decodeSize(buffer.slice(framePosition + 6, framePosition + 10));
        if(buffer.length > 10) {
            this.body = buffer.slice(framePosition + 10, framePosition + 10 + this.size);
        }
        return this;
    }
};

/**
 * @return {boolean}
 */
ID3Tag.prototype.IsValidID3Header = function(buffer) {
    if(buffer.length < 10) {
        return false;
    } else if(buffer.readUIntBE(0, 3) !== 0x494433) {
        return false;
    } else if([0x02, 0x03, 0x04].indexOf(buffer[3]) === -1 || buffer[4] !== 0x00) {
        return false;
    } else if(buffer[6] & 128 === 1 || buffer[7] & 128 === 1 || buffer[8] & 128 === 1 || buffer[9] & 128 === 1) {
        return false;
    }
    return true;
};

/**
 * @return {number}
 */
ID3Tag.prototype.encodeSize = function(totalSize) {
    let byte_3 = totalSize & 0x7F;
    let byte_2 = (totalSize >> 7) & 0x7F;
    let byte_1 = (totalSize >> 14) & 0x7F;
    let byte_0 = (totalSize >> 21) & 0x7F;
    return Buffer.from([byte_0, byte_1, byte_2, byte_3]).readUInt32BE(0);
};

/**
 * @return {number}
 */
ID3Tag.prototype.decodeSize = function(hSize) {
    return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
};

/**
 * @return {Buffer, null}
 */
ID3Tag.prototype.createBuffer = function() {
    let header = Buffer.alloc(10);
    header.writeUIntBE(0x494433, 0, 3);
    header.writeUInt8(this.version, 3);
    let flagsByte = 0;
    if(this.flags) {
        if(this.flags.unsynchronisation) {
            flagsByte += 128;
        }
        if(this.flags.extendedHeader) {
            flagsByte += 64;
        }
        if(this.flags.experimentalIndicator) {
            flagsByte += 32;
        }
        if(this.flags.footerPresent) {
            flagsByte += 16;
        }
    }
    header.writeUInt8(flagsByte, 5);
    header.writeUInt32BE(this.encodeSize(this.size), 6);
    return Buffer.concat([header, this.body]);
};

ID3Tag.prototype.getTags = function() {
    return {};
};

ID3Tag.prototype.getTagFramesFromBody = function() {
    let frames = [];
    if(!this.body) {
        return frames;
    }

    let currentPosition = 0;
    while(currentPosition < this.body.length && this.body[currentPosition] !== 0x00) {
        let currentFrame = (new ID3Frame(this)).load(this.body.slice(currentPosition));
        if(currentFrame && currentFrame.body && currentFrame.body.length > 0) {
            //HANDLE THIS STUFF
        }
    }
    /*
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
     */
};
