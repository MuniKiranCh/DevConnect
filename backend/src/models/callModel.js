const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    callId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['ringing', 'accepted', 'declined', 'ended', 'missed'],
        default: 'ringing'
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        default: 'video'
    },
    // WebRTC signaling data
    offer: {
        type: Object,
        default: null
    },
    answer: {
        type: Object,
        default: null
    },
    iceCandidates: [{
        candidate: Object,
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for efficient querying
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });
callSchema.index({ callId: 1 });
callSchema.index({ status: 1 });

module.exports = mongoose.model('Call', callSchema); 