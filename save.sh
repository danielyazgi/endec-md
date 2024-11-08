export npm_package_version=$(grep -m 1 '"version"' package.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
sed -i -E "s/\.version\(\"[^\"]+\"\)/.version(\"$npm_package_version\")/" src/cli.js
npm install -g . 
endec --version 
git add .
git commit -m "$@"
git push
git tag v$npm_package_version
git push origin v$npm_package_version