/**
 * AI Code Review using GLM (ZhipuAI) API
 * 
 * Fetches the PR diff from GitHub, sends it to GLM for review,
 * and posts the review as a PR comment.
 * 
 * Required environment variables:
 *   GITHUB_TOKEN - GitHub token with PR write permissions
 *   GLM_API_KEY  - ZhipuAI/GLM API key
 *   PR_NUMBER    - Pull request number
 *   REPO         - Repository in "owner/repo" format
 */

const REVIEW_PROMPT = `You are a senior code reviewer for a Tauri v2 desktop app (Rust backend + React/TypeScript frontend).

Review the following pull request diff. Focus on:
1. **Security** — Path traversal, XSS, unsafe IPC patterns, hardcoded secrets
2. **Bugs** — Logic errors, race conditions, null/undefined risks
3. **Performance** — Unnecessary re-renders, blocking operations, memory leaks
4. **Code Quality** — Naming, duplication, missing error handling

Rules:
- Be concise. Only comment on things that matter.
- Use bullet points grouped by category.
- If the code looks good, say so briefly.
- Do NOT nitpick formatting or style preferences.
- Reference specific file names and line numbers when possible.

PR Diff:
`;

async function main() {
    const { GITHUB_TOKEN, GLM_API_KEY, PR_NUMBER, REPO } = process.env;

    if (!GITHUB_TOKEN || !GLM_API_KEY || !PR_NUMBER || !REPO) {
        console.error('Missing required environment variables');
        process.exit(1);
    }

    // 1. Fetch PR diff from GitHub
    console.log(`Fetching diff for PR #${PR_NUMBER} in ${REPO}...`);

    const diffResponse = await fetch(
        `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`,
        {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3.diff',
            },
        }
    );

    if (!diffResponse.ok) {
        console.error(`Failed to fetch PR diff: ${diffResponse.status} ${diffResponse.statusText}`);
        process.exit(1);
    }

    let diff = await diffResponse.text();

    // Truncate very large diffs to stay within token limits
    const MAX_DIFF_CHARS = 12000;
    if (diff.length > MAX_DIFF_CHARS) {
        diff = diff.slice(0, MAX_DIFF_CHARS) + '\n\n... [diff truncated for review]';
    }

    console.log(`Diff size: ${diff.length} chars`);

    // 2. Send to GLM for review
    console.log('Sending to GLM for review...');

    const glmResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLM_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
                {
                    role: 'user',
                    content: REVIEW_PROMPT + diff,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        }),
    });

    if (!glmResponse.ok) {
        const errorText = await glmResponse.text();
        console.error(`GLM API error: ${glmResponse.status} — ${errorText}`);
        // Don't fail the pipeline for AI review issues
        console.log('Skipping AI review due to API error.');
        process.exit(0);
    }

    const glmData = await glmResponse.json();
    const review = glmData.choices?.[0]?.message?.content;

    if (!review) {
        console.error('Empty response from GLM');
        process.exit(0);
    }

    console.log('Review received. Posting to PR...');

    // 3. Post review as a PR comment
    const commentBody = `## 🤖 AI Code Review (GLM)

${review}

---
<sub>Automated review by GLM-4-Flash · [Learn more about Araw's security pipeline](../blob/main/.github/workflows/pr-review.yml)</sub>`;

    const commentResponse = await fetch(
        `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ body: commentBody }),
        }
    );

    if (!commentResponse.ok) {
        const errorText = await commentResponse.text();
        console.error(`Failed to post comment: ${commentResponse.status} — ${errorText}`);
        process.exit(1);
    }

    console.log('✅ AI review posted successfully.');
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
