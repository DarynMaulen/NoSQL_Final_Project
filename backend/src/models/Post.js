const { Schema, model, Types } = require('mongoose');

function makeSlug(title) {
    return title
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 120);
}

const postSchema = new Schema({
    author: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    tags: [{ type: String, index: true }],
    category: { type: String, index: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'draft' },
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

postSchema.pre('validate', async function (next) {
    if (!this.slug && this.title) {
        let base = makeSlug(this.title);
        this.slug = `${base}-${Date.now().toString().slice(-5)}`;
    }
    if (!this.excerpt && this.content) {
        this.excerpt = this.content.slice(0, 200);
    }
    this.updatedAt = new Date();
    next();
});

module.exports = model('Post', postSchema);
