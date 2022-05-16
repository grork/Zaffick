export declare interface UrlEntity {
    url: string;
    expanded_url: string,
    display_url: string,
    indices: [number, number];
}

export declare interface Tweet {
    id_str: string,
    full_text: string,
    truncated: boolean,
    display_text_range: [number, number],
    entities: { urls: UrlEntity[] },
    in_reply_to_status_id_str?: string;
    is_quote_status?: boolean;
    retweeted_status?: Tweet;
    quoted_status?: Tweet;
}