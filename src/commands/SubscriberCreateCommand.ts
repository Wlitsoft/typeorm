import * as fs from "fs";
import {ConnectionOptions} from "../connection/ConnectionOptions";

/**
 * Generates a new subscriber.
 */
export class SubscriberCreateCommand {
    command = "subscriber:create";
    describe = "Generates a new subscriber.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the subscriber class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where subscriber should be created."
            })
            .option("cf", {
                alias: "config",
                default: "ormconfig.json",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {
        const fileContent = SubscriberCreateCommand.getTemplate(argv.name);
        const filename = argv.name + ".ts";
        let directory = argv.dir;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connections: ConnectionOptions[] = require(process.cwd() + "/" + argv.config);
                if (connections) {
                    const connection = connections.find(connection => { // todo: need to implement "environment" support in the ormconfig too
                        return connection.name === argv.connection || ((argv.connection === "default" || !argv.connection) && !connection.name);
                    });
                    if (connection && connection.cli) {
                        directory = connection.cli.subscribersDir;
                    }
                }
            } catch (err) { }
        }

        await SubscriberCreateCommand.createFile(process.cwd() + "/" + (directory ? (directory + "/") : "") + filename, fileContent);
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a file with the given content in the given path.
     */
    protected static createFile(path: string, content: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            fs.writeFile(path, content, err => err ? fail(err) : ok());
        });
    }

    /**
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {EventSubscriber, EntitySubscriberInterface} from "typeorm";

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface<any> {

}
`;
    }

}