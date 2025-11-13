import devcert from "devcert";
import fs from "fs";

const createCert = async () => {
  const ssl = await devcert.certificateFor("localhost");
  fs.writeFileSync("localhost-key.pem", ssl.key);
  fs.writeFileSync("localhost.pem", ssl.cert);
  console.log("✅ Certificate created successfully!");
};
createCert().catch((error) => {
  console.error('❌ Failed to create certificate:', error);
  process.exit(1);
});