"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    engine: "classic",
    datasource: {
        url: "postgresql://neondb_owner:npg_sSDtRa5Jxi0b@ep-delicate-mouse-a40czuxz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
});
//# sourceMappingURL=prisma.config.js.map