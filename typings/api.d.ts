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
    quotedTweet: TweetResponse;
}

export declare interface RetweetResponse {
    type: "retweet";
    content: string;
}

export declare type TweetResponse = StandardTweetResponse | RetweetResponse | ReplyTweetResponse | QuoteTweetResponse;

export declare interface LatestResponse {
    tweets: TweetResponse[];
}