import type { context } from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export async function script(
  github: InstanceType<typeof GitHub>,
  ctx: typeof context,
) {
  const tag_name = process.env.PACKAGE_VERSION;

  if (tag_name === undefined) {
    throw new Error("PACKAGE_VERSION must be set.");
  }

  const createReleaseParams: RestEndpointMethodTypes["repos"]["createRelease"]["parameters"] =
    {
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      tag_name,
      target_commitish: ctx.sha,
      generate_release_notes: true,
    };
  console.log("call repos.createRelease:", createReleaseParams);
  await github.rest.repos.createRelease(createReleaseParams);
}
