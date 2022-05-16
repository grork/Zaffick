import * as nfunc from "@netlify/functions";
import { v1 } from "../../tweets/timeline";
import type * as twypes from "../../tweets/twypes-v1";
import type * as api from "../../typings/api";
import stitched from "../../sample_data/stitched";
import * as tt from "twitter-text";

export enum TweetType {
    Tweet = "tweet",
    Reply = "reply",
    Retweet = "retweet",
    Quote = "quote"
}

function tweetTypeFromTweet(tweet: twypes.Tweet): TweetType {
    if (tweet.is_quote_status) {
        return TweetType.Quote;
    }

    if (tweet.retweeted_status) {
        return TweetType.Retweet;
    }

    if (tweet.in_reply_to_status_id_str) {
        return TweetType.Reply;
    }

    return TweetType.Tweet;
}

function getContentFromTweet(tweet: twypes.Tweet): string {
    const [start, end] = tweet.display_text_range;
    const displayText = tweet.full_text.substring(start, end);
    const content = tt.autoLink(displayText, { urlEntities: tweet.entities.urls });

    return content;
}

async function handler(event: nfunc.HandlerEvent): Promise<nfunc.HandlerResponse> {
    const cannedResponseRequested = (event.queryStringParameters["canned"] == "true");

    let result: twypes.Tweet[] = [];

    if (!cannedResponseRequested) {
        result = await v1.getTimeLineForUserByHandle("wsdot_traffic");
    } else {
        result = stitched();
    }

    const body: api.LatestResponse = { tweets: [] };
    body.tweets = result.map((originalTweet): api.TweetResponse => {
        const tweetType = tweetTypeFromTweet(originalTweet);
        
        switch (tweetType) {
            case "tweet":
            case "reply":
                return {
                    type: tweetType,
                    content: getContentFromTweet(originalTweet)
                };
            
            case "quote":
                return {
                    type: tweetType,
                    content: getContentFromTweet(originalTweet),
                    quotedTweet: {
                        type: <any>tweetTypeFromTweet(originalTweet.quoted_status),
                        content: getContentFromTweet(originalTweet.quoted_status)
                    }
                };
            
            case "retweet":
                return {
                    type: "retweet",
                    content: getContentFromTweet(originalTweet.retweeted_status)
                }
        }
    });

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    };
}

export { handler };