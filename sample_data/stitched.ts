import { Tweet, Tweet as TweetV1 } from "../tweets/twypes-v1";
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
import sample_thread_start from "./thread_start.json";
import sample_thread_2 from "./thread_2.json";


// Borrowed from https://stackoverflow.com/a/2450976
function shuffle(items: Tweet[]) {
    let randomIndex, currentIndex = items.length;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [items[currentIndex], items[randomIndex]] = [
            items[randomIndex], items[currentIndex]];
    }

    return items;
}

export default function stitched(): TweetV1[] {
    const tweets: TweetV1[] = [
        sample_tweet,
        sample_reply_to_other_account,
        sample_reply,
        sample_retweet,
        sample_quote_tweet,
        sample_retweet_quote_tweet,
        sample_picture,
        sample_multiple_pictures,
        sample_animated_gif,
        sample_video,
    ];

    shuffle(tweets);

    tweets.push(sample_thread_2, sample_thread_start);

    return tweets;
}