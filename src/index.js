import fetch from 'node-fetch';

const REPOS_OWNER = 'microsoft';
const REPOS_NAME = 'BotFramework-WebChat';

async function main() {
  const res = await fetch(
    `https://api.github.com/repos/${ encodeURI(REPOS_OWNER) }/${ encodeURI(REPOS_NAME) }`,
    {
      accept: 'application/vnd.github.v3+json'
    }
  );

  console.log(res.ok);

  if (!res.ok) {
    console.error(res.status);
    throw new Error('Failed to fetch repository');
  }

  const {
    forks_count,
    open_issues_count,
    size,
    stargazers_count,
    subscribers_count,
    watchers_count
  } = await res.json();

  console.log({
    forks_count,
    open_issues_count,
    size,
    stargazers_count,
    subscribers_count,
    watchers_count
  });
}

main().catch(err => console.error(err));
