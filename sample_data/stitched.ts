import { Tweet as TweetV1 } from "../tweets/twypes-v1";
import sample_tweet from "./tweet.json";
import sample_reply from "./reply.json";
import sample_reply_to_other_account from "./reply_to_other_account.json";
import sample_retweet from "./retweet.json";
import sample_quote_tweet from "./quote_tweet.json";
import sample_picture from "./picture.json";
import sample_multiple_pictures from "./multiple_pictures.json";
import sample_animated_gif from "./animated_gif.json";
import sample_video from "./video.json";
import sample_retweet_quote_tweet from "./retweet_quote.json";

export default function stitched(): TweetV1[] {
    const tweets: TweetV1[] = [
        sample_tweet,
        sample_reply,
        sample_reply_to_other_account,
        sample_retweet,
        sample_quote_tweet,
        sample_retweet_quote_tweet,
        sample_picture,
        sample_multiple_pictures,
        sample_animated_gif,
        sample_video
    ];

    return tweets;
}