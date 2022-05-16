export declare interface StandardTweetResponse {
    type: "tweet";
    content: string;
}

export declare interface ReplyTweetResponse {
    type: "reply";
    content: string;
}

export declare interface QuoteTweetResponse {
    type: "quote";
    content: string;
    quotedTweet: NonQuoteTweets;
}

export declare interface RetweetResponse {
    type: "retweet";
    content: string;
}

export declare type NonQuoteTweets = StandardTweetResponse | RetweetResponse | ReplyTweetResponse;

export declare type TweetResponse = NonQuoteTweets | QuoteTweetResponse;

export declare interface LatestResponse {
    tweets: TweetResponse[];
}