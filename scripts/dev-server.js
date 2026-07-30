#!/usr/bin/env node

const net = require("net");
const { spawn } = require("child_process");

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const MAX_PORT = 65535;

function isPortAvailable(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort, host) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }

  throw new Error(`No available port found between ${startPort} and ${MAX_PORT}.`);
}

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT, HOST);
  const nextBin = require.resolve("next/dist/bin/next");
  const nextDistDir = `.next-dev-${port}`;
  const child = spawn(process.execPath, [nextBin, "dev", "--hostname", HOST, "--port", String(port)], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      HOST,
      NEXT_DIST_DIR: nextDistDir,
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
