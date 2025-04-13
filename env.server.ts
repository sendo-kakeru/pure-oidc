import * as v from "valibot";

const ServerEnvSchema = v.object({
  GOOGLE_CLIENT_ID: v.string(),
  GOOGLE_CLIENT_SECRET: v.string(),
  BASE_URL: v.pipe(v.string(), v.url()),
});

let env: v.InferOutput<typeof ServerEnvSchema>;
try {
  env = v.parse(ServerEnvSchema, process.env);
} catch (error) {
  if (error instanceof v.ValiError) {
    const invalidPaths = error.issues
      .map((issue) => "\t" + [issue.path?.[0].key, issue.message].join(": "))
      .join("\n");
    throw new Error(
      `Invalid environment variable values detected. Please check the following variables:
${invalidPaths}`,
      { cause: error }
    );
  }
  throw error;
}
export { env };
