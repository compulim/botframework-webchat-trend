import 'dotenv/config';

import fetch from 'node-fetch';
import updateIn from 'simple-update-in';

const {
  DATA_OWNER,
  DATA_REPO,
  DATA_BRANCH,
  GITHUB_API_TOKEN,
  TARGET_OWNER,
  TARGET_REPO
} = process.env;

async function fetchCurrentStats() {
  const res = await fetch(
    `https://api.github.com/repos/${ encodeURI(TARGET_OWNER) }/${ encodeURI(TARGET_REPO) }`,
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${ GITHUB_API_TOKEN }`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repository, server returned ${ res.status } (${ res.statusText }).`);
  }

  const {
    forks_count,
    open_issues_count,
    size,
    stargazers_count,
    subscribers_count,
    watchers_count
  } = await res.json();

  return {
    forks_count,
    open_issues_count,
    size,
    stargazers_count,
    subscribers_count,
    watchers_count
  };
}

async function fetchStatsHistory() {
  const res = await fetch(
    `https://api.github.com/repos/${ encodeURI(DATA_OWNER) }/${ encodeURI(DATA_REPO) }/contents/stats.json?ref=${ encodeURI(DATA_BRANCH) }`,
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${ GITHUB_API_TOKEN }`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to stats.json, server returned ${ res.status }`);
  }

  const { content, sha } = await res.json();

  return { history: JSON.parse(Buffer.from(content, 'base64').toString()), sha };
}

async function putStatsHistory(history, sha) {
  const res = await fetch(
    `https://api.github.com/repos/${ encodeURI(DATA_OWNER) }/${ encodeURI(DATA_REPO) }/contents/stats.json`,
    {
      body: JSON.stringify({
        branch: DATA_BRANCH,
        content: Buffer.from(JSON.stringify(history, null, 2)).toString('base64'),
        message: 'Add data point',
        sha
      }),
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `token ${ GITHUB_API_TOKEN }`,
        'content-type': 'application/json'
      },
      method: 'PUT'
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update stats.json, server returned ${ res.status } (${ res.statusText })`);
  }

  const { commit: { sha } } = await res.json();

  return sha;
}

async function main() {
  const current = await fetchCurrentStats();

  console.log(current);

  const { history, sha } = await fetchStatsHistory();
  const nextHistory = updateIn(history, ['series'], series => [{
    now: new Date().toISOString(),
    ...current
  }, ...series || []]);

  const commitSHA = await putStatsHistory(nextHistory, sha);

  console.log(`History updated, commit is ${ commitSHA }.`);
}

main().catch(err => console.error(err));
