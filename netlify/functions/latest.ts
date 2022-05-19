import * as nfunc from "@netlify/functions";
import { v1 } from "../../tweets/timeline";
import * as twypes from "../../tweets/twypes-v1";
import * as api from "../../typings/api";
import stitched from "../../sample_data/stitched";
import * as tt from "twitter-text";

function isRetweet(tweet: twypes.Tweet): boolean {
    return !!tweet.retweeted_status;
}

function isReplyToSomeoneElse(tweet: twypes.Tweet): boolean {
    return (tweet.in_reply_to_status_id_str &&
        tweet.in_reply_to_screen_name !== tweet.user.screen_name);
}

function doesQuoteTweet(tweet: twypes.Tweet): boolean {
    return !!tweet.quoted_status;
}

function getRetweetAuthor(tweet: twypes.Tweet): string {
    if (tweet.retweeted_status) {
        return tweet.user.screen_name;
    }

    return undefined;
}

function getContentFromTweet(tweet: twypes.Tweet): string {
    const [start, end] = tweet.display_text_range;
    const displayText = tweet.full_text.substring(start, end);
    const content = tt.autoLink(displayText, { urlEntities: tweet.entities.urls });

    return content;
}

function getImagesFromTweet(tweet: twypes.Tweet): string[] {
    const imageEntities = tweet.extended_entities?.media?.filter((media): media is twypes.PhotoEntity => media.type === "photo");

    if (!imageEntities?.length) {
        return undefined;
    }

    return imageEntities.map((media) => media.media_url_https);
}

function getVideoFromTweet(tweet: twypes.Tweet): api.VideoInfo {
    const video = tweet.extended_entities?.media?.find((media): media is twypes.VideoEntity => media.type === "video");
    if (!video) {
        return undefined;
    }

    // We only want video/mp4 videos 'cause chrome won't play HLS natively
    const mp4s = video.video_info.variants.filter((info) => info.content_type === "video/mp4");
    if (!mp4s?.length) {
        return undefined;
    }

    // We want the *highest* bitrate
    mp4s.sort((a, b) => b.bitrate - a.bitrate);

    return {
        url: mp4s[0].url,
        poster: video.media_url_https,
    }
}

function tweetToResponse(tweet: twypes.Tweet): Omit<api.TweetResponse, "type"> {
    return {
        content: getContentFromTweet(tweet),
        images: getImagesFromTweet(tweet),
        video: getVideoFromTweet(tweet),
        posted: tweet.created_at,
        author: tweet.user.screen_name,
        replyingTo: tweet.in_reply_to_status_id_str || undefined
    };
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

    body.tweets = result.reduce<api.TweetResponse[]>((items, originalTweet) => {
        if (isReplyToSomeoneElse(originalTweet)) {
            return items;
        }

        const tweetContentSource = (isRetweet(originalTweet) ? originalTweet.retweeted_status : originalTweet);

        const tweetResponse = tweetToResponse(tweetContentSource);
        tweetResponse.retweet_author = getRetweetAuthor(originalTweet);
        if (doesQuoteTweet(tweetContentSource)) {
            tweetResponse.quotedTweet = tweetToResponse(tweetContentSource.quoted_status);
        }

        items.push(tweetResponse);

        return items;
    }, []);

    return {
        statusCode: 200,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-cache, no-store, max-age=0"
        },
        body: JSON.stringify(body)
    };
}

export { handler };