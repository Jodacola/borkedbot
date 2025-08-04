import { PullRequest } from "./github.service";

export type EnhancedPullRequest = {
    updated: boolean;
} & PullRequest;