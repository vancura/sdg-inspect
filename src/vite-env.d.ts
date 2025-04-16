/// <reference types="vite/client" />

/** The environment variables. */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface ImportMetaEnv {
    /** The title of the application. */
    readonly VITE_APP_TITLE: string;
}

/** The import meta. */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface ImportMeta {
    /** The environment variables. */
    readonly env: ImportMetaEnv;
}
