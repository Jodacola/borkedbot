export interface Project {
    id: string;
    projectName: string;
    githubRepo: string;
    url: string;
}

export interface Group {
    id: string;
    name: string;
    projects: Project[];
}

export interface AppConfig {
    groups: Group[];
} 