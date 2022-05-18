export declare interface VideoInfo {
    url: string;
    poster: string;
}

declare interface BaseTweet {
    content: string;
    images?: string[];
    video?: VideoInfo;
    posted: string;
    author: string;
    retweet_author?: string;
}

export declare interface StandardTweetResponse extends BaseTweet {
    type: "tweet";
}

export declare interface ReplyTweetResponse extends BaseTweet {
    type: "reply";
}

export declare interface QuoteTweetResponse extends BaseTweet {
    type: "quote";
    quotedTweet: NonQuoteTweetResponse;
}

export declare type NonQuoteTweetResponse = StandardTweetResponse | ReplyTweetResponse;
export declare type TweetResponse = NonQuoteTweetResponse | QuoteTweetResponse;

export declare interface LatestResponse {
    tweets: TweetResponse[];
}