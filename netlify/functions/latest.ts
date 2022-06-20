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
    const content = tt.autoLink(displayText, { urlEntities: tweet.entities.urls, targetBlank: true });

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

function tweetToResponse(tweet: twypes.Tweet): api.TweetResponse {
    return {
        content: getContentFromTweet(tweet),
        url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        images: getImagesFromTweet(tweet),
        video: getVideoFromTweet(tweet),
        posted: tweet.created_at,
        author: tweet.user.screen_name,
        author_url: `https://twitter.com/${tweet.user.screen_name}`,
        replyingToUrl: tweet.in_reply_to_status_id_str ? `https://twitter.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str}` : undefined,
        replyingToId: tweet.in_reply_to_status_id_str
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
    const seekingRepliesTo: Map<string, api.TweetResponse[]> = new Map();

    body.tweets = result.reduce<api.TweetResponse[]>((items, originalTweet) => {
        // Skip it if it's not a reply to us
        if (isReplyToSomeoneElse(originalTweet)) {
            return items;
        }

        // Determine the source of the content -- retweets get the actual thing
        // being retweeted
        const tweetContentSource = (isRetweet(originalTweet) ? originalTweet.retweeted_status : originalTweet);

        // Conver the twitter format, to our 'view model' format
        const tweetResponse = tweetToResponse(tweetContentSource);

        // Author of a tweet being retweeted isn't the same as the person doing
        // the retweeting.
        tweetResponse.retweet_author = getRetweetAuthor(originalTweet);

        // Dig out the 'inner' tweet if it's a quote tweet.
        if (doesQuoteTweet(tweetContentSource)) {
            tweetResponse.quotedTweet = tweetToResponse(tweetContentSource.quoted_status);
        }

        // Check if someone is looking for this reply, which means we're not the
        // newest reply
        let replies = seekingRepliesTo.get(originalTweet.id_str);

        // If this tweet itself is a reply to something, we need to mark the
        // reply as an ID we're looking for
        if (tweetResponse.replyingToUrl) {
            if (!replies) {
                // This is the newest reply, so we can use leave it in the tweet
                // list, and start tracking. Don't include this tweet itself
                // because it'll be in the main timeline
                tweetResponse.replies = replies = [];
            } else {
                // Add to the list of replies in this thread
                replies.unshift(tweetResponse);
            }

            // Set another map entry for the reply-to so we can capture it if
            // we encounter it later
            seekingRepliesTo.set(originalTweet.in_reply_to_status_id_str, replies);
        } else if (replies) {
            // If someone is seeking a reply with this ID, but this tweet itself
            // isn't a reply, thats the *start* of the thread, so we can can
            // insert the item at the beginning of the thread
            replies.unshift(tweetResponse);
        }

        // If someone was seeking the ID to reply to, don't include it in the
        // tweet list, since it'll be included in the 'newest' tweet in the
        // thread.
        // Note, this is predicated on the assumption that the tweets being
        // processed are in verse chronological order.
        if (!seekingRepliesTo.has(originalTweet.id_str)) {
            items.push(tweetResponse);
        }

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