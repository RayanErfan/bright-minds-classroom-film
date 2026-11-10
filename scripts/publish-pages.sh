#!/bin/sh
# Rebuild the film and publish dist/ to the gh-pages branch, which serves
# https://rayanerfan.github.io/bright-minds-classroom-film/.
# Requires a push token in GITHUB_TOKEN or a configured git remote.
set -eu
cd "$(dirname "$0")/.."

npm run build
test -f dist/index.html

remote=$(git remote get-url origin 2>/dev/null || printf '%s' "${GITHUB_REMOTE:?set origin or GITHUB_REMOTE}")
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

cp -a dist/. "$work/"
touch "$work/.nojekyll"

cd "$work"
git init -q -b gh-pages
git config user.name "${GIT_AUTHOR_NAME:-pages}"
git config user.email "${GIT_AUTHOR_EMAIL:-pages@users.noreply.github.com}"
git add -A
git commit -q -m "Publish the standalone film site"
git push -f "$remote" gh-pages
printf 'Published. GitHub Pages rebuilds in about a minute.\n'
