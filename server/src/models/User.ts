import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IChat {
    question: string;
    answer: string;
}

export interface IUser extends Document {
    email: string;
    password: string;
    chatHistory: IChat[];
}

const chatSchema = new Schema<IChat>({
    question: { type: String, required: true },
    answer: { type: String, required: true },
});

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    chatHistory: [chatSchema],
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = model<IUser>('User', userSchema);
export default User;
