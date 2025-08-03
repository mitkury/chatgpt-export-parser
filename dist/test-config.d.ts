export declare const TEST_CONFIG: {
    readonly defaultArchive: string;
    readonly archives: {
        readonly default: string;
    };
};
export declare function getTestArchivePath(archiveName?: keyof typeof TEST_CONFIG.archives): string;
export declare function testArchiveExists(archiveName?: keyof typeof TEST_CONFIG.archives): boolean;
//# sourceMappingURL=test-config.d.ts.map