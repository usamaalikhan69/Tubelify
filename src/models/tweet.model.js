import mongoose ,{Schema} from "mongoose"


const tweetSchema = new Schema({
 
    content: {
        type: String,
        maxlength: 140
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
} , { timestamps: true })



export const Tweet = mongoose.model('Tweet' , tweetSchema) 


