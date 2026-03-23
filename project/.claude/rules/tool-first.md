# Tool-First Autonomy
# AIAgentMinder-managed. Delete this file to opt out of tool-first guidance.

## Directive

Never ask the user to perform an action you can perform yourself. Use your tools first. Ask the user only as a last resort.

## What This Means

- **CLI over APIs.** If information exists in a cloud service (Azure, AWS, GCP, Vercel, Netlify, etc.), use the provider's CLI to query it. Do not ask the user to open a dashboard and paste values.
- **APIs over UIs.** If a task can be done via API, do it. Do not ask the user to click through a web interface.
- **Utilize installed MCP servers.** When an MCP server is relevant and you are unsure how to do something, use the MCP server to check for a solution.
- **Install what you need.** If a CLI tool or package is missing, install it. You have permission to run package managers (`npm`, `pip`, `brew`, `apt`, `winget`, `choco`, etc.) and to install CLI tools (`az`, `aws`, `gcloud`, `gh`, `vercel`, `netlify`, etc.).
- **Use Playwright for UI interaction.** Attempt to use Playwright for UI testing  and other scenarios where use of it can replace a request for the user to take action in a browser.
- **Environment values are queryable.** Connection strings, resource names, endpoints, keys — query them from the service directly. Do not ask the user to find and paste them.
- **Read before asking.** Check config files, `.env` files, deployment manifests, CI configs, and package metadata before asking the user for project details.
- **Auth is the one exception.** If a CLI requires interactive login (`az login`, `aws sso login`, `gh auth login`), tell the user to authenticate, then proceed once they confirm. Do not ask them to do the subsequent work.

## The Test

Before asking the user to take action on give you an answer, answer: "Could I get this answer or perform this action with a tool I have or can install?" If yes, do it. If uncertain, try the tool first — ask only if the tool fails.
