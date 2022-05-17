export declare interface VideoInfo {
    url: string;
    poster: string;
}

export declare interface StandardTweetResponse {
    type: "tweet";
    content: string;
    images?: string[];
    video?: VideoInfo;
}

export declare interface ReplyTweetResponse {
    type: "reply";
    content: string;
    images?: string[];
    video?: VideoInfo;
}

export declare interface RetweetResponse {
    type: "retweet";
    content: string;
    images?: string[];
    video?: VideoInfo;
}

export declare interface QuoteTweetResponse {
    type: "quote";
    content: string;
    quotedTweet: NonQuoteTweetResponse;
}

export declare type NonQuoteTweetResponse = StandardTweetResponse | RetweetResponse | ReplyTweetResponse;
export declare type TweetResponse = NonQuoteTweetResponse | QuoteTweetResponse;

export declare interface LatestResponse {
    tweets: TweetResponse[];
}