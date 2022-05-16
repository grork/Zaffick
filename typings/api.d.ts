export declare type TweetType = "tweet" | "reply" | "retweet" | "quote";

export declare interface TweetResponse {
    type: TweetType;
    content: string;
}

export declare interface LatestResponse {
    tweets: TweetResponse[];
}