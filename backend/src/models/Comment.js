const { Schema, model, Types } = require('mongoose');

const commentSchema = new Schema({
    postId: { type: Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    parentId: { type: Types.ObjectId, ref: 'Comment', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

commentSchema.pre('save', async function () {
    this.updatedAt = new Date();
});

module.exports = model('Comment', commentSchema);